import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComicFace, Bubble } from './types';
import { generateTTS } from './aiService';
import { soundManager } from './SoundManager';

interface VideoGeneratorProps {
    comicFaces: ComicFace[];
    onClose: () => void;
}

interface Scene {
    id: string;
    layout: string; // 'single' | 'hero-left' | 'hero-right' | 'hero-top' | 'hero-bottom' | 'triptych' | 'grid-2x2' | 'mosaic-3' | 'mosaic-4' | 'split-v' | 'split-h' | 'sidebar-left' | 'sidebar-right' | 'strip-3-v' | 'quad-asym'
    panels: {
        imageUrl: string;
        bubbles: Bubble[];
        description?: string;
    }[];
    audioUrl?: string; // TTS audio
    sfxUrl?: string; // SFX audio
    sfxId?: string;
    animationIntensity: number; // 0 to 1
    duration: number; // in ms
    transition: string;
    description?: string;
}

const LAYOUT_TEMPLATES: Record<string, { slots: { x: number, y: number, w: number, h: number }[] }> = {
    'single': { slots: [{ x: 0, y: 0, w: 100, h: 100 }] },
    'hero-left': { slots: [{ x: 0, y: 0, w: 66, h: 100 }, { x: 66, y: 0, w: 34, h: 50 }, { x: 66, y: 50, w: 34, h: 50 }] },
    'hero-right': { slots: [{ x: 34, y: 0, w: 66, h: 100 }, { x: 0, y: 0, w: 34, h: 50 }, { x: 0, y: 50, w: 34, h: 50 }] },
    'hero-top': { slots: [{ x: 0, y: 0, w: 100, h: 66 }, { x: 0, y: 66, w: 50, h: 34 }, { x: 50, y: 66, w: 50, h: 34 }] },
    'hero-bottom': { slots: [{ x: 0, y: 34, w: 100, h: 66 }, { x: 0, y: 0, w: 50, h: 34 }, { x: 50, y: 0, w: 50, h: 34 }] },
    'triptych': { slots: [{ x: 0, y: 0, w: 33.3, h: 100 }, { x: 33.3, y: 0, w: 33.4, h: 100 }, { x: 66.7, y: 0, w: 33.3, h: 100 }] },
    'grid-2x2': { slots: [{ x: 0, y: 0, w: 50, h: 50 }, { x: 50, y: 0, w: 50, h: 50 }, { x: 0, y: 50, w: 50, h: 50 }, { x: 50, y: 50, w: 50, h: 50 }] },
    'mosaic-3': { slots: [{ x: 0, y: 0, w: 60, h: 60 }, { x: 60, y: 0, w: 40, h: 100 }, { x: 0, y: 60, w: 60, h: 40 }] },
    'mosaic-4': { slots: [{ x: 0, y: 0, w: 40, h: 60 }, { x: 40, y: 0, w: 60, h: 40 }, { x: 0, y: 60, w: 60, h: 40 }, { x: 60, y: 40, w: 40, h: 60 }] },
    'split-v': { slots: [{ x: 0, y: 0, w: 50, h: 100 }, { x: 50, y: 0, w: 50, h: 100 }] },
    'split-h': { slots: [{ x: 0, y: 0, w: 100, h: 50 }, { x: 0, y: 50, w: 100, h: 50 }] },
    'sidebar-left': { slots: [{ x: 0, y: 0, w: 25, h: 100 }, { x: 25, y: 0, w: 75, h: 100 }] },
    'sidebar-right': { slots: [{ x: 75, y: 0, w: 25, h: 100 }, { x: 0, y: 0, w: 75, h: 100 }] },
    'strip-3-v': { slots: [{ x: 0, y: 0, w: 100, h: 33.3 }, { x: 0, y: 33.3, w: 100, h: 33.4 }, { x: 0, y: 66.7, w: 100, h: 33.3 }] },
    'quad-asym': { slots: [{ x: 0, y: 0, w: 70, h: 30 }, { x: 70, y: 0, w: 30, h: 70 }, { x: 0, y: 30, w: 30, h: 70 }, { x: 30, y: 70, w: 70, h: 30 }] },
    'diagonal-3': { slots: [{ x: 0, y: 0, w: 70, h: 70 }, { x: 70, y: 0, w: 30, h: 30 }, { x: 70, y: 30, w: 30, h: 70 }] },
    'focus-center': { slots: [{ x: 20, y: 20, w: 60, h: 60 }, { x: 0, y: 0, w: 100, h: 20 }, { x: 0, y: 80, w: 100, h: 20 }, { x: 0, y: 20, w: 20, h: 60 }, { x: 80, y: 20, w: 20, h: 60 }] },
};

const SFX_LIBRARY = [
    { id: 'none', name: 'None', url: '', keywords: [] },
    { id: 'page-turn', name: 'Page Turn', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3', keywords: ['turn', 'page', 'book', 'read', 'paper'] },
    { id: 'impact', name: 'Impact / Punch', url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_f3c7a33467.mp3', keywords: ['hit', 'punch', 'impact', 'fight', 'bam', 'pow', 'attack'] },
    { id: 'whoosh', name: 'Whoosh', url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3', keywords: ['fly', 'fast', 'move', 'swing', 'whoosh', 'dash'] },
    { id: 'explosion', name: 'Explosion', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3', keywords: ['boom', 'explode', 'explosion', 'blast', 'fire'] },
    { id: 'ambient-city', name: 'City Ambience', url: 'https://cdn.pixabay.com/download/audio/2022/01/21/audio_31743c58be.mp3', keywords: ['city', 'street', 'traffic', 'outside', 'crowd'] },
    { id: 'magic', name: 'Magic Sparkle', url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3', keywords: ['magic', 'spell', 'sparkle', 'glow', 'mystic'] },
];

const TRANSITION_TYPES = [
    { id: 'cut', name: 'Hard Cut' },
    { id: 'fade', name: 'Fade' },
    { id: 'wipe', name: 'Wipe' },
    { id: 'comic-panel-slide', name: 'Comic Panel Slide' },
    { id: 'zoom-through', name: 'Zoom Through' },
    { id: 'slide-up', name: 'Slide Up' },
    { id: 'slide-down', name: 'Slide Down' },
    { id: 'zoom-in', name: 'Zoom In' },
    { id: 'zoom-out', name: 'Zoom Out' },
];

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({ comicFaces, onClose }) => {
    const [step, setStep] = useState<'idle' | 'configuring' | 'generating' | 'playing' | 'error'>('idle');
    const [error, setError] = useState<{ title: string; message: string; fatal: boolean } | null>(null);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [scenes, setScenes] = useState<Scene[]>([]);
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [transitionType, setTransitionType] = useState<string>('random');
    const [transitionDuration, setTransitionDuration] = useState<number>(0.8);
    const [pacingMultiplier, setPacingMultiplier] = useState<number>(1.0);
    const [dialogueSpeed, setDialogueSpeed] = useState<number>(1.0);
    const [bgmTrack, setBgmTrack] = useState<string>('');
    const [bgmVolume, setBgmVolume] = useState<number>(0.3);
    const [sfxEnabled, setSfxEnabled] = useState<boolean>(true);
    const [layoutMode, setLayoutMode] = useState<'sequential' | 'dynamic' | 'full-page'>('sequential');
    const [aspectRatio, setAspectRatio] = useState<string>('16:9');
    
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
    const sfxAudioRef = useRef<HTMLAudioElement | null>(null);
    const sceneTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const suggestSFX = (description: string): { id: string, url: string } => {
        const desc = description.toLowerCase();
        for (const sfx of SFX_LIBRARY) {
            if (sfx.id === 'none') continue;
            if (sfx.keywords.some(k => desc.includes(k))) {
                return { id: sfx.id, url: sfx.url };
            }
        }
        return { id: 'none', url: '' };
    };

    const prepareScenes = () => {
        const extractedScenes: Scene[] = [];
        const availableTransitions = TRANSITION_TYPES.map(t => t.id);
        
        for (const face of comicFaces) {
            if (face.type === 'cover' && face.panels?.[0]?.imageUrl) {
                const sfx = sfxEnabled ? suggestSFX('cover page book') : { id: 'none', url: '' };
                extractedScenes.push({
                    id: `cover-${face.id}`,
                    layout: 'single',
                    panels: [{
                        imageUrl: face.panels[0].imageUrl,
                        bubbles: [],
                        description: 'Cover page'
                    }],
                    animationIntensity: 0.5,
                    duration: 4000 * pacingMultiplier,
                    transition: transitionType === 'random' ? availableTransitions[Math.floor(Math.random() * availableTransitions.length)] : transitionType,
                    sfxUrl: sfx.url,
                    sfxId: sfx.id,
                    description: 'Cover page'
                });
            } else if (face.type === 'story' && face.panels) {
                const facePanels = face.panels.filter(p => !!p.imageUrl);
                
                if (layoutMode === 'sequential') {
                    // One panel per scene
                    for (let i = 0; i < facePanels.length; i++) {
                        const panel = facePanels[i];
                        const panelBubbles = face.bubbles?.filter(b => b.panelIndex === i) || [];
                        const sfx = sfxEnabled ? suggestSFX(panel.description || '') : { id: 'none', url: '' };
                        
                        extractedScenes.push({
                            id: panel.id,
                            layout: 'single',
                            panels: [{
                                imageUrl: panel.imageUrl!,
                                bubbles: panelBubbles,
                                description: panel.description
                            }],
                            animationIntensity: 0.5,
                            duration: Math.max(3000, panelBubbles.length * 2500) * pacingMultiplier,
                            transition: transitionType === 'random' ? availableTransitions[Math.floor(Math.random() * availableTransitions.length)] : transitionType,
                            sfxUrl: sfx.url,
                            sfxId: sfx.id,
                            description: panel.description
                        });
                    }
                } else if (layoutMode === 'full-page') {
                    // Group all panels of a face into one scene (or split if too many)
                    const facePanels = face.panels.filter(p => !!p.imageUrl);
                    const count = Math.min(facePanels.length, 4);
                    
                    // Determine hero index based on bubble count
                    let heroIdx = 0;
                    let maxBubbles = 0;
                    const scenePanels = facePanels.slice(0, count).map((p, idx) => {
                        const bubbles = face.bubbles?.filter(b => b.panelIndex === idx) || [];
                        if (bubbles.length > maxBubbles) {
                            maxBubbles = bubbles.length;
                            heroIdx = idx;
                        }
                        return {
                            imageUrl: p.imageUrl!,
                            bubbles,
                            description: p.description
                        };
                    });

                    let layout = 'grid-2x2';
                    if (count === 1) layout = 'single';
                    else if (count === 2) {
                        const r = Math.random();
                        if (r < 0.33) layout = 'split-v';
                        else if (r < 0.66) layout = 'split-h';
                        else layout = 'sidebar-left';
                    }
                    else if (count === 3) {
                        // If we have a hero, use a hero layout
                        if (maxBubbles > 1) {
                            const r = Math.random();
                            if (r < 0.33) layout = 'hero-left';
                            else if (r < 0.66) layout = 'hero-top';
                            else layout = 'diagonal-3';
                            
                            // Swap hero to first position if needed
                            if (heroIdx !== 0) {
                                [scenePanels[0], scenePanels[heroIdx]] = [scenePanels[heroIdx], scenePanels[0]];
                            }
                        } else {
                            const r = Math.random();
                            if (r < 0.25) layout = 'triptych';
                            else if (r < 0.5) layout = 'mosaic-3';
                            else if (r < 0.75) layout = 'strip-3-v';
                            else layout = 'diagonal-3';
                        }
                    }
                    else if (count === 4) {
                        const r = Math.random();
                        if (r < 0.33) layout = 'grid-2x2';
                        else if (r < 0.66) layout = 'mosaic-4';
                        else layout = 'quad-asym';
                    }

                    const sfx = sfxEnabled ? suggestSFX(facePanels[0].description || '') : { id: 'none', url: '' };

                    extractedScenes.push({
                        id: `face-${face.id}`,
                        layout,
                        panels: scenePanels,
                        animationIntensity: 0.5,
                        duration: Math.max(5000, scenePanels.reduce((acc, p) => acc + p.bubbles.length * 2000, 0)) * pacingMultiplier,
                        transition: transitionType === 'random' ? availableTransitions[Math.floor(Math.random() * availableTransitions.length)] : transitionType,
                        sfxUrl: sfx.url,
                        sfxId: sfx.id,
                        description: `Page layout: ${layout}`
                    });
                } else if (layoutMode === 'dynamic') {
                    // Mix of single panels and layouts
                    let i = 0;
                    while (i < facePanels.length) {
                        const remaining = facePanels.length - i;
                        const useLayout = remaining >= 2 && Math.random() > 0.4;
                        
                        if (useLayout) {
                            const count = Math.min(remaining, Math.random() > 0.7 ? 4 : (Math.random() > 0.5 ? 3 : 2));
                            let layout = 'single';
                            if (count === 2) {
                                const r = Math.random();
                                if (r < 0.33) layout = 'split-v';
                                else if (r < 0.66) layout = 'split-h';
                                else layout = 'sidebar-right';
                            } else if (count === 3) {
                                const r = Math.random();
                                if (r < 0.15) layout = 'hero-left';
                                else if (r < 0.3) layout = 'hero-top';
                                else if (r < 0.45) layout = 'hero-right';
                                else if (r < 0.6) layout = 'hero-bottom';
                                else if (r < 0.8) layout = 'mosaic-3';
                                else layout = 'diagonal-3';
                            } else if (count === 4) {
                                const r = Math.random();
                                if (r < 0.3) layout = 'grid-2x2';
                                else if (r < 0.6) layout = 'mosaic-4';
                                else if (r < 0.9) layout = 'quad-asym';
                                else layout = 'focus-center';
                            }
                            
                            const scenePanels = facePanels.slice(i, i + count).map((p, idx) => ({
                                imageUrl: p.imageUrl!,
                                bubbles: face.bubbles?.filter(b => b.panelIndex === i + idx) || [],
                                description: p.description
                            }));

                            extractedScenes.push({
                                id: `dynamic-${face.id}-${i}`,
                                layout,
                                panels: scenePanels,
                                animationIntensity: 0.5,
                                duration: Math.max(4000, scenePanels.reduce((acc, p) => acc + p.bubbles.length * 2200, 0)) * pacingMultiplier,
                                transition: transitionType === 'random' ? availableTransitions[Math.floor(Math.random() * availableTransitions.length)] : transitionType,
                                sfxUrl: sfxEnabled ? suggestSFX(scenePanels[0].description || '').url : '',
                                description: `Dynamic ${layout}`
                            });
                            i += count;
                        } else {
                            const panel = facePanels[i];
                            const panelBubbles = face.bubbles?.filter(b => b.panelIndex === i) || [];
                            extractedScenes.push({
                                id: panel.id,
                                layout: 'single',
                                panels: [{
                                    imageUrl: panel.imageUrl!,
                                    bubbles: panelBubbles,
                                    description: panel.description
                                }],
                                animationIntensity: 0.5,
                                duration: Math.max(3000, panelBubbles.length * 2500) * pacingMultiplier,
                                transition: transitionType === 'random' ? availableTransitions[Math.floor(Math.random() * availableTransitions.length)] : transitionType,
                                sfxUrl: sfxEnabled ? suggestSFX(panel.description || '').url : '',
                                description: panel.description
                            });
                            i++;
                        }
                    }
                }
            }
        }
        setScenes(extractedScenes);
        setStep('configuring');
    };

    const generateVideo = async () => {
        setStep('generating');
        setProgress(0);
        setError(null);
        setStatusText('Initializing generation...');
        
        const extractedScenes = [...scenes];
        const totalScenes = extractedScenes.length;

        try {
            setStatusText('Generating voiceovers (TTS)...');
            // Generate TTS for scenes with bubbles
            for (let i = 0; i < totalScenes; i++) {
                const scene = extractedScenes[i];
                const allBubbles = scene.panels.flatMap(p => p.bubbles);
                if (allBubbles.length > 0) {
                    try {
                        // Combine text for all bubbles in the scene
                        const combinedText = allBubbles.map(b => b.text).join('. ');
                        // Assign a voice based on character (mocking voice assignment for now)
                        const voiceName = 'Puck'; // Default voice
                        const base64Audio = await generateTTS(combinedText, voiceName);
                        if (base64Audio) {
                            scene.audioUrl = base64Audio;
                            // Estimate duration based on text length (roughly 150 words per min)
                            // Adjusted by dialogueSpeed
                            const wordCount = combinedText.split(' ').length;
                            const ttsDuration = ((wordCount / (150 * dialogueSpeed)) * 60000 + 1000);
                            scene.duration = Math.max(scene.duration, ttsDuration * pacingMultiplier);
                        }
                    } catch (e) {
                        console.error(`TTS failed for scene ${i + 1}`, e);
                    }
                }
                setProgress(10 + Math.floor(((i + 1) / totalScenes) * 60));
            }

            setProgress(70);
            setStatusText('Composing audio and transitions...');
            await new Promise(r => setTimeout(r, 1000)); // Mock composing time

            setProgress(100);
            setStatusText('Ready!');
            setScenes(extractedScenes);
            
            setTimeout(() => {
                setStep('playing');
                playScene(0, extractedScenes);
            }, 800);
        } catch (err: any) {
            console.error("Generation failed", err);
            setError({
                title: 'Generation Failed',
                message: err.message || 'An unexpected error occurred during video generation.',
                fatal: true
            });
            setStep('error');
        }
    };

    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    const exportVideo = async () => {
        setIsExporting(true);
        setExportProgress(0);
        setError(null);
        
        try {
            const canvas = document.createElement('canvas');
            canvas.width = aspectRatio === '9:16' ? 720 : aspectRatio === '1:1' ? 1080 : 1280;
            canvas.height = aspectRatio === '9:16' ? 1280 : aspectRatio === '1:1' ? 1080 : 720;
            const ctx = canvas.getContext('2d')!;
            
            const stream = canvas.captureStream(30); // 30 FPS
            
            // Setup Audio Context to mix TTS audio
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const dest = audioCtx.createMediaStreamDestination();
            
            // Mix BGM if selected
            let bgmAudio: HTMLAudioElement | null = null;
            if (bgmTrack) {
                bgmAudio = new Audio(bgmTrack);
                bgmAudio.crossOrigin = "anonymous";
                bgmAudio.loop = true;
                const bgmSource = audioCtx.createMediaElementSource(bgmAudio);
                const gainNode = audioCtx.createGain();
                gainNode.gain.value = bgmVolume;
                bgmSource.connect(gainNode);
                gainNode.connect(dest);
                // gainNode.connect(audioCtx.destination); // Don't play out loud during export to avoid double sound
                await bgmAudio.play().catch(e => {
                    console.warn("BGM play error during export", e);
                    // Non-fatal, continue without BGM
                });
            }

            // Combine video and audio tracks
            const combinedStream = new MediaStream([
                ...stream.getVideoTracks(),
                ...dest.stream.getAudioTracks()
            ]);
            
            // Check for supported mime types
            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
                ? 'video/webm;codecs=vp9' 
                : 'video/webm';
            
            const recorder = new MediaRecorder(combinedStream, { mimeType });
            const chunks: Blob[] = [];
            
            recorder.ondataavailable = e => {
                if (e.data.size > 0) chunks.push(e.data);
            };
            
            recorder.onstop = () => {
                if (bgmAudio) bgmAudio.pause();
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'comic-video.webm';
                a.click();
                URL.revokeObjectURL(url);
                setIsExporting(false);
            };
            
            recorder.start();
            
            // Render loop
            let totalDuration = scenes.reduce((acc, s) => acc + s.duration, 0);
            let currentTime = 0;
            const fps = 30;
            const frameDuration = 1000 / fps;
            
            for (let i = 0; i < scenes.length; i++) {
                const scene = scenes[i];
                const template = LAYOUT_TEMPLATES[scene.layout] || LAYOUT_TEMPLATES.single;
                
                // Load all images for the scene
                const images: HTMLImageElement[] = [];
                for (const p of scene.panels) {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.src = p.imageUrl;
                    try {
                        await new Promise((resolve, reject) => {
                            img.onload = resolve;
                            img.onerror = () => reject(new Error(`Failed to load image for scene ${i + 1}`));
                        });
                        images.push(img);
                    } catch (imgErr) {
                        console.error(imgErr);
                        throw imgErr;
                    }
                }
                
                // Play audio for this scene
                if (scene.audioUrl) {
                    const audio = new Audio(scene.audioUrl);
                    const source = audioCtx.createMediaElementSource(audio);
                    source.connect(dest);
                    audio.play().catch(e => console.warn("TTS play error during export", e));
                }
                if (scene.sfxUrl) {
                    const sfxAudio = new Audio(scene.sfxUrl);
                    sfxAudio.crossOrigin = "anonymous";
                    const sfxSource = audioCtx.createMediaElementSource(sfxAudio);
                    const gainNode = audioCtx.createGain();
                    gainNode.gain.value = 0.5;
                    sfxSource.connect(gainNode);
                    gainNode.connect(dest);
                    sfxAudio.play().catch(e => console.warn("SFX play error during export", e));
                }
                
                const sceneFrames = Math.floor(scene.duration / frameDuration);
                for (let f = 0; f < sceneFrames; f++) {
                    // Draw background
                    ctx.fillStyle = 'black';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Draw each panel in its slot
                    images.forEach((img, idx) => {
                        const slot = template.slots[idx] || template.slots[0];
                        const sx = (slot.x / 100) * canvas.width;
                        const sy = (slot.y / 100) * canvas.height;
                        const sw = (slot.w / 100) * canvas.width;
                        const sh = (slot.h / 100) * canvas.height;

                        // Ken Burns per panel
                        const intensity = scene.animationIntensity || 0.05;
                        const scale = 1 + (f / sceneFrames) * (intensity * 0.1);
                        const dw = sw * scale;
                        const dh = sh * scale;
                        const dx = sx + (sw - dw) / 2;
                        const dy = sy + (sh - dh) / 2;

                        ctx.globalAlpha = 1.0;
                        if (scene.transition !== 'cut' && f < (transitionDuration * fps)) {
                            ctx.globalAlpha = f / (transitionDuration * fps);
                        }
                        
                        // Clip to slot
                        ctx.save();
                        ctx.beginPath();
                        ctx.rect(sx, sy, sw, sh);
                        ctx.clip();
                        ctx.drawImage(img, dx, dy, dw, dh);
                        
                        // Border
                        ctx.strokeStyle = 'white';
                        ctx.lineWidth = 4;
                        ctx.strokeRect(sx, sy, sw, sh);
                        ctx.restore();
                    });

                    ctx.globalAlpha = 1.0;
                    
                    // Draw Bubbles
                    if (f > 15) { // Delay bubbles slightly
                        const allBubbles = scene.panels.flatMap(p => p.bubbles);
                        allBubbles.forEach((b, idx) => {
                            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                            ctx.fillRect(50, canvas.height - 150 - (idx * 60), canvas.width - 100, 50);
                            ctx.fillStyle = 'white';
                            ctx.font = '24px "Comic Sans MS", cursive, sans-serif';
                            ctx.fillText(`${b.character ? b.character + ': ' : ''}${b.text}`, 70, canvas.height - 115 - (idx * 60));
                        });
                    }
                    
                    currentTime += frameDuration;
                    setExportProgress((currentTime / totalDuration) * 100);
                    
                    // Wait for next frame
                    await new Promise(r => setTimeout(r, frameDuration));
                }
            }
            
            recorder.stop();
        } catch (err: any) {
            console.error("Export failed", err);
            setIsExporting(false);
            setError({
                title: 'Export Failed',
                message: err.message || 'An error occurred while rendering the video file.',
                fatal: false
            });
            // We don't change step to 'error' here because we want to stay on the player screen
            // but we should show an error message.
        }
    };

    const playScene = (index: number, sceneList: Scene[]) => {
        if (index >= sceneList.length) {
            setIsPlaying(false);
            if (bgmAudioRef.current) {
                bgmAudioRef.current.pause();
                bgmAudioRef.current.currentTime = 0;
            }
            return;
        }
        
        setCurrentSceneIndex(index);
        setIsPlaying(true);
        const scene = sceneList[index];

        // Start BGM if first scene
        if (index === 0 && bgmTrack && bgmAudioRef.current) {
            bgmAudioRef.current.src = bgmTrack;
            bgmAudioRef.current.volume = bgmVolume;
            bgmAudioRef.current.loop = true;
            bgmAudioRef.current.play().catch(e => console.error("BGM play error", e));
        }

        // Play audio if exists
        if (scene.audioUrl) {
            if (audioRef.current) {
                audioRef.current.src = scene.audioUrl;
                audioRef.current.play().catch(e => console.error("Audio play error", e));
            }
        } else {
            // Play a generic transition sound
            soundManager.play('flip');
        }

        // Play SFX if exists
        if (scene.sfxUrl && sfxAudioRef.current) {
            sfxAudioRef.current.src = scene.sfxUrl;
            sfxAudioRef.current.volume = 0.5;
            sfxAudioRef.current.play().catch(e => console.error("SFX play error", e));
        }

        // Schedule next scene
        if (sceneTimeoutRef.current) clearTimeout(sceneTimeoutRef.current);
        sceneTimeoutRef.current = setTimeout(() => {
            playScene(index + 1, sceneList);
        }, scene.duration);
    };

    const stopPlayback = () => {
        if (sceneTimeoutRef.current) clearTimeout(sceneTimeoutRef.current);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        if (bgmAudioRef.current) {
            bgmAudioRef.current.pause();
            bgmAudioRef.current.currentTime = 0;
        }
        if (sfxAudioRef.current) {
            sfxAudioRef.current.pause();
            sfxAudioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
    };

    useEffect(() => {
        return () => stopPlayback();
    }, []);

    const renderTransition = (transition: string) => {
        switch (transition) {
            case 'cut':
                return { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
            case 'zoom-through':
                return { initial: { scale: 0.5, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 2, opacity: 0 } };
            case 'comic-panel-slide':
                return { initial: { x: '100%', opacity: 1 }, animate: { x: 0, opacity: 1 }, exit: { x: '-100%', opacity: 1 } };
            case 'wipe':
                return { initial: { clipPath: 'inset(0 100% 0 0)' }, animate: { clipPath: 'inset(0 0 0 0)' }, exit: { clipPath: 'inset(0 0 0 100%)' } };
            case 'slide-up':
                return { initial: { y: '100%', opacity: 1 }, animate: { y: 0, opacity: 1 }, exit: { y: '-100%', opacity: 1 } };
            case 'slide-down':
                return { initial: { y: '-100%', opacity: 1 }, animate: { y: 0, opacity: 1 }, exit: { y: '100%', opacity: 1 } };
            case 'zoom-in':
                return { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 1.2, opacity: 0 } };
            case 'zoom-out':
                return { initial: { scale: 1.2, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.8, opacity: 0 } };
            case 'fade':
            default:
                return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 font-comic">
            <audio ref={audioRef} />
            <audio ref={bgmAudioRef} />
            <audio ref={sfxAudioRef} />
            
            {step === 'idle' && (
                <div className="bg-white p-8 border-4 border-black max-w-2xl w-full text-center shadow-[8px_8px_0px_rgba(255,255,255,0.2)]">
                    <h2 className="text-3xl font-black mb-4 uppercase">Generate Video</h2>
                    <p className="mb-6 text-gray-700">Transform your comic into an animated video with voiceovers, music, and transitions!</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-left">
                            <label className="block font-bold mb-1 text-sm">Layout Mode:</label>
                            <select value={layoutMode} onChange={e => setLayoutMode(e.target.value as any)} className="w-full p-2 border-2 border-black font-comic text-sm">
                                <option value="sequential">Single Panel (Sequential)</option>
                                <option value="dynamic">Dynamic Mix (Asymmetrical)</option>
                                <option value="full-page">Full Page Layouts</option>
                            </select>
                        </div>
                        <div className="text-left">
                            <label className="block font-bold mb-1 text-sm">Aspect Ratio:</label>
                            <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="w-full p-2 border-2 border-black font-comic text-sm">
                                <option value="16:9">16:9 (Landscape)</option>
                                <option value="9:16">9:16 (Vertical)</option>
                                <option value="1:1">1:1 (Square)</option>
                            </select>
                        </div>
                        <div className="text-left">
                            <label className="block font-bold mb-1 text-sm">Global Pacing: {pacingMultiplier.toFixed(1)}x</label>
                            <input type="range" min="0.5" max="3.0" step="0.1" value={pacingMultiplier} onChange={e => setPacingMultiplier(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500" title="Adjusts the overall duration of all scenes" />
                        </div>
                        <div className="text-left">
                            <label className="block font-bold mb-1 text-sm">Dialogue Speed: {dialogueSpeed.toFixed(1)}x</label>
                            <input type="range" min="0.5" max="2.0" step="0.1" value={dialogueSpeed} onChange={e => setDialogueSpeed(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500" title="Affects how long panels with dialogue stay on screen" />
                        </div>
                        <div className="text-left">
                            <label className="block font-bold mb-1 text-sm">Transition:</label>
                            <select value={transitionType} onChange={e => setTransitionType(e.target.value)} className="w-full p-2 border-2 border-black font-comic text-sm">
                                <option value="random">Random Mix</option>
                                <option value="cut">Hard Cut</option>
                                <option value="fade">Fade</option>
                                <option value="wipe">Wipe</option>
                                <option value="comic-panel-slide">Comic Panel Slide</option>
                                <option value="zoom-through">Zoom Through</option>
                            </select>
                        </div>
                        <div className="text-left">
                            <label className="block font-bold mb-1 text-sm">Trans. Duration: {transitionDuration.toFixed(1)}s</label>
                            <input type="range" min="0.1" max="2.0" step="0.1" value={transitionDuration} onChange={e => setTransitionDuration(parseFloat(e.target.value))} className="w-full" />
                        </div>
                        <div className="text-left">
                            <label className="block font-bold mb-1 text-sm">Background Music:</label>
                            <select value={bgmTrack} onChange={e => setBgmTrack(e.target.value)} className="w-full p-2 border-2 border-black font-comic text-sm">
                                <option value="">None</option>
                                <option value="https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3">Action</option>
                                <option value="https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3">Suspense</option>
                                <option value="https://cdn.pixabay.com/download/audio/2022/01/21/audio_31743c58be.mp3">Comedy</option>
                            </select>
                        </div>
                        <div className="text-left">
                            <label className="block font-bold mb-1 text-sm">BGM Volume: {Math.round(bgmVolume * 100)}%</label>
                            <input type="range" min="0" max="1" step="0.1" value={bgmVolume} onChange={e => setBgmVolume(parseFloat(e.target.value))} className="w-full" disabled={!bgmTrack} />
                        </div>
                        <div className="text-left col-span-2 flex items-center gap-2">
                            <input type="checkbox" id="sfxToggle" checked={sfxEnabled} onChange={e => setSfxEnabled(e.target.checked)} className="w-5 h-5" />
                            <label htmlFor="sfxToggle" className="font-bold text-sm">Enable Auto Sound Effects (SFX)</label>
                        </div>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <button onClick={onClose} className="px-4 py-2 border-4 border-black bg-gray-200 hover:bg-gray-300 font-bold uppercase">Cancel</button>
                        <button onClick={prepareScenes} className="px-4 py-2 border-4 border-black bg-red-500 text-white hover:bg-red-600 font-bold uppercase shadow-[4px_4px_0px_black]">Next: Configure Scenes</button>
                    </div>
                </div>
            )}

            {step === 'configuring' && (
                <div className="bg-white p-6 border-4 border-black max-w-4xl w-full flex flex-col h-[90vh] shadow-[8px_8px_0px_rgba(255,255,255,0.2)]">
                    <h2 className="text-2xl font-black mb-4 uppercase">Configure Scenes</h2>
                    
                    <div className="flex-1 overflow-y-auto pr-2 mb-6 space-y-4">
                        {scenes.map((scene, idx) => (
                            <div key={scene.id} className="flex gap-4 p-3 border-2 border-black bg-gray-50 rounded-lg">
                                <div className="w-32 h-32 flex-shrink-0 border-2 border-black overflow-hidden relative bg-black">
                                    <div className="w-full h-full relative">
                                        {(LAYOUT_TEMPLATES[scene.layout] || LAYOUT_TEMPLATES.single).slots.map((slot, sIdx) => (
                                            <div 
                                                key={sIdx}
                                                className="absolute border border-white/30 overflow-hidden"
                                                style={{
                                                    left: `${slot.x}%`,
                                                    top: `${slot.y}%`,
                                                    width: `${slot.w}%`,
                                                    height: `${slot.h}%`
                                                }}
                                            >
                                                {scene.panels[sIdx] && (
                                                    <img src={scene.panels[sIdx].imageUrl} alt="Panel" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="absolute top-0 left-0 bg-black text-white px-1.5 py-0.5 text-[10px] font-bold">#{idx + 1}</div>
                                </div>
                                
                                <div className="flex-1 grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1">Layout</label>
                                        <select 
                                            value={scene.layout} 
                                            onChange={e => {
                                                const newScenes = [...scenes];
                                                newScenes[idx].layout = e.target.value;
                                                setScenes(newScenes);
                                            }}
                                            className="w-full p-1 border-2 border-black text-sm"
                                        >
                                            {Object.keys(LAYOUT_TEMPLATES).filter(l => {
                                                const slots = LAYOUT_TEMPLATES[l].slots.length;
                                                return slots >= scene.panels.length;
                                            }).map(l => (
                                                <option key={l} value={l}>{l.replace('-', ' ')}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-1">Description</p>
                                        <p className="text-sm italic truncate">{scene.panels.map(p => p.description).filter(Boolean).join(', ') || 'No description'}</p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1">Duration: {(scene.duration / 1000).toFixed(1)}s</label>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="range" 
                                                min="1000" 
                                                max="15000" 
                                                step="500" 
                                                value={scene.duration} 
                                                onChange={e => {
                                                    const newScenes = [...scenes];
                                                    newScenes[idx].duration = parseInt(e.target.value);
                                                    setScenes(newScenes);
                                                }}
                                                className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                            />
                                            <input 
                                                type="number" 
                                                value={scene.duration} 
                                                onChange={e => {
                                                    const newScenes = [...scenes];
                                                    newScenes[idx].duration = parseInt(e.target.value) || 1000;
                                                    setScenes(newScenes);
                                                }}
                                                className="w-16 p-0.5 border-2 border-black text-[10px] font-bold text-center"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold uppercase mb-1">Transition</label>
                                        <select 
                                            value={scene.transition} 
                                            onChange={e => {
                                                const newScenes = [...scenes];
                                                newScenes[idx].transition = e.target.value;
                                                setScenes(newScenes);
                                            }}
                                            className="w-full p-1 border-2 border-black text-sm"
                                        >
                                            {TRANSITION_TYPES.map(t => (
                                                <option key={t.id} value={t.id}>{t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold uppercase mb-1">Animation Intensity: {Math.round(scene.animationIntensity * 100)}%</label>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="1" 
                                            step="0.1" 
                                            value={scene.animationIntensity} 
                                            onChange={e => {
                                                const newScenes = [...scenes];
                                                newScenes[idx].animationIntensity = parseFloat(e.target.value);
                                                setScenes(newScenes);
                                            }}
                                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold uppercase mb-1">Sound Effect (SFX)</label>
                                        <div className="flex gap-2">
                                            <select 
                                                value={scene.sfxId || 'none'} 
                                                onChange={e => {
                                                    const newScenes = [...scenes];
                                                    const sfx = SFX_LIBRARY.find(s => s.id === e.target.value);
                                                    newScenes[idx].sfxId = e.target.value;
                                                    newScenes[idx].sfxUrl = sfx?.url || '';
                                                    setScenes(newScenes);
                                                }}
                                                className="flex-1 p-1 border-2 border-black text-sm"
                                            >
                                                {SFX_LIBRARY.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                            <button 
                                                onClick={() => {
                                                    if (scene.sfxUrl) {
                                                        const audio = new Audio(scene.sfxUrl);
                                                        audio.volume = 0.5;
                                                        audio.play().catch(e => console.error("SFX preview error", e));
                                                    }
                                                }}
                                                disabled={!scene.sfxUrl}
                                                className="px-2 border-2 border-black bg-white hover:bg-gray-100 disabled:opacity-50"
                                                title="Preview SFX"
                                            >
                                                🔊
                                            </button>
                                        </div>
                                        {scene.sfxId !== 'none' && (
                                            <p className="text-[10px] text-indigo-600 font-bold mt-1 uppercase">Suggested based on content</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="flex gap-4 justify-center pt-4 border-t-2 border-black">
                        <button onClick={() => setStep('idle')} className="px-6 py-2 border-4 border-black bg-gray-200 hover:bg-gray-300 font-bold uppercase">Back</button>
                        <button onClick={generateVideo} className="px-6 py-2 border-4 border-black bg-red-500 text-white hover:bg-red-600 font-bold uppercase shadow-[4px_4px_0px_black]">Generate Final Video</button>
                    </div>
                </div>
            )}

            {step === 'generating' && (
                <div className="bg-white p-8 border-4 border-black max-w-md w-full text-center shadow-[8px_8px_0px_rgba(255,255,255,0.2)]">
                    <h2 className="text-2xl font-black mb-4 uppercase animate-pulse">Processing...</h2>
                    <div className="w-full h-8 border-4 border-black bg-gray-200 relative overflow-hidden mb-4">
                        <div className="absolute top-0 left-0 bottom-0 bg-green-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="font-bold text-sm mb-2">{statusText}</p>
                    <p className="text-xs text-gray-500 italic">This may take a minute depending on comic length.</p>
                </div>
            )}

            {step === 'error' && (
                <div className="bg-white p-8 border-4 border-black max-w-md w-full text-center shadow-[8px_8px_0px_rgba(255,255,255,0.2)]">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-600">
                        <span className="text-3xl font-black">!</span>
                    </div>
                    <h2 className="text-2xl font-black mb-2 uppercase text-red-600">{error?.title || 'Error'}</h2>
                    <p className="mb-6 text-gray-700">{error?.message || 'An unexpected error occurred.'}</p>
                    
                    <div className="flex gap-4 justify-center">
                        <button 
                            onClick={() => {
                                setError(null);
                                setStep('configuring');
                            }} 
                            className="px-4 py-2 border-4 border-black bg-gray-200 hover:bg-gray-300 font-bold uppercase"
                        >
                            Back to Config
                        </button>
                        <button 
                            onClick={generateVideo} 
                            className="px-4 py-2 border-4 border-black bg-red-500 text-white hover:bg-red-600 font-bold uppercase shadow-[4px_4px_0px_black]"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {step === 'playing' && scenes.length > 0 && (
                <div className={`relative w-full max-w-4xl bg-black border-4 border-white overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.2)] ${aspectRatio === '16:9' ? 'aspect-video' : aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[80vh]' : 'aspect-square max-h-[80vh]'}`}>
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={currentSceneIndex}
                            {...renderTransition(scenes[currentSceneIndex].transition)}
                            transition={{ duration: scenes[currentSceneIndex].transition === 'cut' ? 0 : transitionDuration }}
                            className="absolute inset-0 flex items-center justify-center"
                        >
                            {/* Layout Rendering */}
                            <div className="absolute inset-0 w-full h-full">
                                {(LAYOUT_TEMPLATES[scenes[currentSceneIndex].layout] || LAYOUT_TEMPLATES.single).slots.map((slot, sIdx) => {
                                    const panel = scenes[currentSceneIndex].panels[sIdx];
                                    if (!panel) return null;
                                    return (
                                        <motion.div
                                            key={sIdx}
                                            className="absolute overflow-hidden border-2 border-white"
                                            style={{
                                                left: `${slot.x}%`,
                                                top: `${slot.y}%`,
                                                width: `${slot.w}%`,
                                                height: `${slot.h}%`
                                            }}
                                        >
                                            <motion.img 
                                                src={panel.imageUrl} 
                                                alt="Scene"
                                                className="w-full h-full object-cover"
                                                initial={{ scale: 1 }}
                                                animate={{ 
                                                    scale: 1 + (scenes[currentSceneIndex].animationIntensity * 0.1), 
                                                    x: (Math.random() - 0.5) * (scenes[currentSceneIndex].animationIntensity * 20), 
                                                    y: (Math.random() - 0.5) * (scenes[currentSceneIndex].animationIntensity * 20) 
                                                }}
                                                transition={{ duration: scenes[currentSceneIndex].duration / 1000, ease: "linear" }}
                                            />
                                        </motion.div>
                                    );
                                })}
                            </div>
                            
                            {/* Captions / Bubbles */}
                            {scenes[currentSceneIndex].panels.flatMap(p => p.bubbles).map((bubble, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 + (idx * 1.5) }}
                                    className="absolute bottom-10 left-10 right-10 bg-black/70 text-white p-4 border-2 border-white text-xl text-center font-bold z-10"
                                >
                                    {bubble.character && <span className="text-yellow-400 mr-2">{bubble.character}:</span>}
                                    {bubble.text}
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>

                    {/* Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center">
                        <div className="text-white font-bold">
                            Scene {currentSceneIndex + 1} / {scenes.length}
                        </div>
                        
                        {error && !error.fatal && (
                            <div className="absolute top-[-60px] left-4 right-4 bg-red-500 text-white p-2 border-2 border-white text-xs font-bold flex justify-between items-center animate-bounce">
                                <span>⚠️ {error.message}</span>
                                <button onClick={() => setError(null)} className="ml-2 bg-white text-red-500 px-1 rounded">X</button>
                            </div>
                        )}

                        <div className="flex gap-4 items-center">
                            {isExporting ? (
                                <div className="text-white font-bold text-sm bg-black/50 px-2 py-1 rounded">
                                    Exporting... {Math.round(exportProgress)}%
                                </div>
                            ) : (
                                <button 
                                    onClick={() => {
                                        stopPlayback();
                                        exportVideo();
                                    }} 
                                    className="bg-green-500 text-white px-4 py-1 rounded font-bold hover:bg-green-600"
                                >
                                    Export WebM
                                </button>
                            )}
                            <button 
                                onClick={() => {
                                    if (isPlaying) stopPlayback();
                                    else playScene(currentSceneIndex, scenes);
                                }} 
                                className="bg-white text-black px-4 py-1 rounded font-bold hover:bg-gray-200"
                            >
                                {isPlaying ? 'Pause' : 'Play'}
                            </button>
                            <button onClick={onClose} className="bg-red-500 text-white px-4 py-1 rounded font-bold hover:bg-red-600">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
