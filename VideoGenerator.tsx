import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComicFace, Bubble } from './types';
import { generateTTS } from './aiService';
import { soundManager } from './SoundManager';
import { t } from './translations';

interface VideoGeneratorProps {
    comicFaces: ComicFace[];
    onClose: () => void;
    lang: string;
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

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({ comicFaces, onClose, lang }) => {
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
                        
                        // Apply filters
                        ctx.filter = 'contrast(125%) saturate(150%)';
                        ctx.drawImage(img, dx, dy, dw, dh);
                        ctx.filter = 'none'; // Reset filter
                        
                        // Border
                        ctx.strokeStyle = 'black';
                        ctx.lineWidth = 8;
                        ctx.strokeRect(sx, sy, sw, sh);
                        ctx.restore();
                    });

                    ctx.globalAlpha = 1.0;
                    
                    // Draw Bubbles
                    if (f > 15) { // Delay bubbles slightly
                        const allBubbles = scene.panels.flatMap(p => p.bubbles);
                        allBubbles.forEach((b, idx) => {
                            const bubbleY = canvas.height - 150 - (idx * 70);
                            const bubbleX = 50;
                            const bubbleWidth = canvas.width - 100;
                            const bubbleHeight = 60;
                            
                            // Bubble Background
                            ctx.save();
                            ctx.translate(bubbleX, bubbleY);
                            ctx.rotate(-1 * Math.PI / 180); // -1 degree rotation
                            
                            // Shadow
                            ctx.fillStyle = 'black';
                            ctx.beginPath();
                            if (ctx.roundRect) {
                                ctx.roundRect(8, 8, bubbleWidth, bubbleHeight, [16, 16, 16, 0]);
                            } else {
                                ctx.rect(8, 8, bubbleWidth, bubbleHeight);
                            }
                            ctx.fill();
                            
                            // Tail shadow
                            ctx.beginPath();
                            ctx.moveTo(40 + 8, bubbleHeight + 8);
                            ctx.lineTo(30 + 8, bubbleHeight + 20 + 8);
                            ctx.lineTo(60 + 8, bubbleHeight + 8);
                            ctx.fill();

                            // Bubble
                            ctx.fillStyle = 'white';
                            ctx.strokeStyle = 'black';
                            ctx.lineWidth = 4;
                            
                            ctx.beginPath();
                            if (ctx.roundRect) {
                                ctx.roundRect(0, 0, bubbleWidth, bubbleHeight, [16, 16, 16, 0]);
                            } else {
                                ctx.rect(0, 0, bubbleWidth, bubbleHeight);
                            }
                            ctx.fill();
                            ctx.stroke();
                            
                            // Bubble Tail
                            ctx.beginPath();
                            ctx.moveTo(40, bubbleHeight);
                            ctx.lineTo(30, bubbleHeight + 20);
                            ctx.lineTo(60, bubbleHeight);
                            ctx.fill();
                            ctx.stroke();
                            
                            // Clear line between bubble and tail
                            ctx.beginPath();
                            ctx.moveTo(42, bubbleHeight);
                            ctx.lineTo(58, bubbleHeight);
                            ctx.strokeStyle = 'white';
                            ctx.lineWidth = 6;
                            ctx.stroke();
                            
                            // Text
                            ctx.fillStyle = 'black';
                            ctx.font = '900 24px "Comic Sans MS", cursive, sans-serif';
                            ctx.textAlign = 'left';
                            ctx.textBaseline = 'middle';
                            
                            let textX = 20;
                            if (b.character) {
                                const charText = b.character.toUpperCase() + ': ';
                                // Drop shadow
                                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                                ctx.fillText(charText, textX + 1, bubbleHeight / 2 + 1);
                                // Main text
                                ctx.fillStyle = '#DC2626'; // red-600
                                ctx.fillText(charText, textX, bubbleHeight / 2);
                                textX += ctx.measureText(charText).width + 10;
                            }
                            
                            ctx.fillStyle = 'black';
                            ctx.fillText(b.text, textX, bubbleHeight / 2);
                            
                            ctx.restore();
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
        <div 
            className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 md:p-8 font-comic overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-gen-title"
        >
            {/* Comic Halftone Background Pattern */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2.5px)', backgroundSize: '10px 10px' }}></div>

            <audio ref={audioRef} />
            <audio ref={bgmAudioRef} />
            <audio ref={sfxAudioRef} />
            
            {step === 'idle' && (
                <div className="bg-white p-6 md:p-10 border-[6px] md:border-[8px] border-black max-w-3xl w-full text-center shadow-[12px_12px_0px_rgba(255,255,0,1)] overflow-y-auto max-h-[90vh] relative transform rotate-1">
                    <div className="absolute -top-6 -left-6 w-12 h-12 bg-red-500 border-4 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)] z-10 transform -rotate-12">
                        <span className="text-white font-black text-2xl">!</span>
                    </div>
                    
                    <h2 id="video-gen-title" className="text-4xl md:text-5xl font-black mb-6 uppercase tracking-tighter text-black drop-shadow-[3px_3px_0_rgba(255,0,0,1)] transform -skew-x-6">
                        {t(lang, "GENERATE_VIDEO")}
                    </h2>
                    
                    <div className="bg-yellow-100 border-4 border-black p-4 mb-8 shadow-[4px_4px_0px_rgba(0,0,0,1)] transform -rotate-1">
                        <p className="text-black font-bold text-base md:text-lg uppercase tracking-tight">{t(lang, "VIDEO_GEN_DESC")}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] transform rotate-1">
                            <label htmlFor="layout-mode" className="block font-black mb-2 text-sm md:text-base uppercase tracking-widest text-red-600">{t(lang, "LAYOUT_MODE")}</label>
                            <select 
                                id="layout-mode"
                                value={layoutMode} 
                                onChange={e => setLayoutMode(e.target.value as any)} 
                                className="w-full p-3 border-4 border-black font-comic font-bold text-sm md:text-base bg-yellow-50 focus:ring-4 focus:ring-red-500 outline-none cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                            >
                                <option value="sequential">{t(lang, "SEQUENTIAL")}</option>
                                <option value="dynamic">{t(lang, "DYNAMIC")}</option>
                                <option value="full-page">{t(lang, "FULL_PAGE")}</option>
                            </select>
                        </div>
                        
                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] transform -rotate-1">
                            <label htmlFor="aspect-ratio" className="block font-black mb-2 text-sm md:text-base uppercase tracking-widest text-blue-600">{t(lang, "ASPECT_RATIO")}</label>
                            <select 
                                id="aspect-ratio"
                                value={aspectRatio} 
                                onChange={e => setAspectRatio(e.target.value)} 
                                className="w-full p-3 border-4 border-black font-comic font-bold text-sm md:text-base bg-blue-50 focus:ring-4 focus:ring-red-500 outline-none cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                            >
                                <option value="16:9">16:9 (Landscape)</option>
                                <option value="9:16">9:16 (Vertical)</option>
                                <option value="1:1">1:1 (Square)</option>
                            </select>
                        </div>
                        
                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] transform rotate-1">
                            <label htmlFor="pacing-range" className="block font-black mb-2 text-sm md:text-base uppercase tracking-widest text-green-600 flex justify-between">
                                <span>{t(lang, "GLOBAL_PACING")}</span>
                                <span className="bg-black text-white px-2 py-1 text-xs">{pacingMultiplier.toFixed(1)}x</span>
                            </label>
                            <input 
                                id="pacing-range"
                                type="range" 
                                min="0.5" 
                                max="3.0" 
                                step="0.1" 
                                value={pacingMultiplier} 
                                onChange={e => setPacingMultiplier(parseFloat(e.target.value))} 
                                className="w-full h-4 bg-gray-200 border-2 border-black rounded-none appearance-none cursor-pointer accent-red-500" 
                                title={t(lang, "PACING_TOOLTIP")} 
                                aria-label={t(lang, "GLOBAL_PACING")}
                            />
                        </div>
                        
                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] transform -rotate-1">
                            <label htmlFor="dialogue-speed" className="block font-black mb-2 text-sm md:text-base uppercase tracking-widest text-purple-600 flex justify-between">
                                <span>{t(lang, "DIALOGUE_SPEED")}</span>
                                <span className="bg-black text-white px-2 py-1 text-xs">{dialogueSpeed.toFixed(1)}x</span>
                            </label>
                            <input 
                                id="dialogue-speed"
                                type="range" 
                                min="0.5" 
                                max="2.0" 
                                step="0.1" 
                                value={dialogueSpeed} 
                                onChange={e => setDialogueSpeed(parseFloat(e.target.value))} 
                                className="w-full h-4 bg-gray-200 border-2 border-black rounded-none appearance-none cursor-pointer accent-red-500" 
                                title={t(lang, "DIALOGUE_SPEED_TOOLTIP")} 
                                aria-label={t(lang, "DIALOGUE_SPEED")}
                            />
                        </div>
                        
                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] transform rotate-1">
                            <label htmlFor="transition-type" className="block font-black mb-2 text-sm md:text-base uppercase tracking-widest text-orange-600">{t(lang, "TRANSITION")}</label>
                            <select 
                                id="transition-type"
                                value={transitionType} 
                                onChange={e => setTransitionType(e.target.value)} 
                                className="w-full p-3 border-4 border-black font-comic font-bold text-sm md:text-base bg-orange-50 focus:ring-4 focus:ring-red-500 outline-none cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                            >
                                <option value="random">{t(lang, "RANDOM_MIX")}</option>
                                {TRANSITION_TYPES.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] transform -rotate-1">
                            <label htmlFor="transition-duration" className="block font-black mb-2 text-sm md:text-base uppercase tracking-widest text-pink-600 flex justify-between">
                                <span>{t(lang, "TRANS_DURATION")}</span>
                                <span className="bg-black text-white px-2 py-1 text-xs">{transitionDuration.toFixed(1)}s</span>
                            </label>
                            <input 
                                id="transition-duration"
                                type="range" 
                                min="0.1" 
                                max="2.0" 
                                step="0.1" 
                                value={transitionDuration} 
                                onChange={e => setTransitionDuration(parseFloat(e.target.value))} 
                                className="w-full h-4 bg-gray-200 border-2 border-black rounded-none appearance-none cursor-pointer accent-red-500"
                                aria-label={t(lang, "TRANS_DURATION")}
                            />
                        </div>
                        
                        <div className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] transform rotate-1 md:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="bgm-track" className="block font-black mb-2 text-sm md:text-base uppercase tracking-widest text-teal-600">{t(lang, "BGM")}</label>
                                    <select 
                                        id="bgm-track"
                                        value={bgmTrack} 
                                        onChange={e => setBgmTrack(e.target.value)} 
                                        className="w-full p-3 border-4 border-black font-comic font-bold text-sm md:text-base bg-teal-50 focus:ring-4 focus:ring-red-500 outline-none cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                                    >
                                        <option value="">{t(lang, "NONE")}</option>
                                        <option value="https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3">{t(lang, "ACTION")}</option>
                                        <option value="https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3">{t(lang, "SUSPENSE")}</option>
                                        <option value="https://cdn.pixabay.com/download/audio/2022/01/21/audio_31743c58be.mp3">{t(lang, "COMEDY")}</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="bgm-volume" className="block font-black mb-2 text-sm md:text-base uppercase tracking-widest text-teal-600 flex justify-between">
                                        <span>{t(lang, "BGM_VOLUME")}</span>
                                        <span className="bg-black text-white px-2 py-1 text-xs">{Math.round(bgmVolume * 100)}%</span>
                                    </label>
                                    <input 
                                        id="bgm-volume"
                                        type="range" 
                                        min="0" 
                                        max="1" 
                                        step="0.1" 
                                        value={bgmVolume} 
                                        onChange={e => setBgmVolume(parseFloat(e.target.value))} 
                                        className="w-full h-4 bg-gray-200 border-2 border-black rounded-none appearance-none cursor-pointer accent-red-500 disabled:opacity-50" 
                                        disabled={!bgmTrack} 
                                        aria-label={t(lang, "BGM_VOLUME")}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-yellow-300 border-4 border-black p-4 shadow-[4px_4px_0px_rgba(0,0,0,1)] transform -rotate-1 md:col-span-2 flex items-center justify-center gap-4 cursor-pointer hover:bg-yellow-400 transition-colors" onClick={() => setSfxEnabled(!sfxEnabled)}>
                            <div className={`w-8 h-8 border-4 border-black flex items-center justify-center bg-white shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-transform ${sfxEnabled ? 'scale-110' : ''}`}>
                                {sfxEnabled && <div className="w-4 h-4 bg-red-500 transform rotate-45"></div>}
                            </div>
                            <label htmlFor="sfxToggle" className="font-black text-lg md:text-xl uppercase tracking-widest cursor-pointer select-none">{t(lang, "ENABLE_SFX")}</label>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 justify-center mt-8">
                        <button 
                            onClick={onClose} 
                            className="px-8 py-3 border-[4px] border-black bg-white text-black font-black uppercase text-lg tracking-widest hover:bg-gray-200 active:scale-95 transition-all shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transform rotate-1"
                            aria-label="Cancel and close video generator"
                        >{t(lang, "CANCEL")}</button>
                        <button 
                            onClick={prepareScenes} 
                            className="px-8 py-3 border-[4px] border-black bg-red-500 text-white font-black uppercase text-lg tracking-widest hover:bg-red-400 active:scale-95 transition-all shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] transform -rotate-1"
                            aria-label="Proceed to scene configuration"
                        >{t(lang, "NEXT_CONFIG")}</button>
                    </div>
                </div>
            )}

            {step === 'configuring' && (
                <div 
                    className="bg-white p-6 md:p-8 border-[6px] md:border-[8px] border-black max-w-5xl w-full flex flex-col h-[95vh] md:h-[90vh] shadow-[12px_12px_0px_rgba(255,255,0,1)] md:shadow-[20px_20px_0px_rgba(255,255,0,1)] relative overflow-hidden transform rotate-1"
                    role="region"
                    aria-labelledby="config-scenes-title"
                >
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 2px, transparent 2.5px)', backgroundSize: '10px 10px' }}></div>
                    
                    <h2 id="config-scenes-title" className="font-comic text-4xl md:text-5xl mb-6 border-b-[6px] border-black pb-4 text-black uppercase tracking-tighter text-center bg-yellow-400 p-2 transform -skew-x-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] relative z-10 drop-shadow-[2px_2px_0_rgba(255,0,0,1)]">{t(lang, "CONFIGURE_SCENES")}</h2>
                    
                    <div className="flex-1 overflow-y-auto pr-4 mb-8 space-y-8 custom-scrollbar relative z-10">
                        {scenes.map((scene, idx) => (
                            <div key={scene.id} className="flex flex-col md:flex-row gap-6 p-6 border-[6px] border-black bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)] transform -rotate-1 hover:rotate-0 transition-transform relative">
                                <div className="absolute -top-4 -left-4 bg-red-500 text-white font-black font-comic text-2xl w-12 h-12 flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transform -rotate-12 z-20">
                                    {idx + 1}
                                </div>
                                
                                <div className="w-full md:w-48 h-56 md:h-48 flex-shrink-0 border-[6px] border-black overflow-hidden relative bg-black shadow-[inset_4px_4px_0px_rgba(255,255,255,0.2)] transform rotate-2">
                                    <div className="w-full h-full relative" aria-hidden="true">
                                        {(LAYOUT_TEMPLATES[scene.layout] || LAYOUT_TEMPLATES.single).slots.map((slot, sIdx) => (
                                            <div 
                                                key={sIdx}
                                                className="absolute border-4 border-black overflow-hidden bg-white"
                                                style={{
                                                    left: `${slot.x}%`,
                                                    top: `${slot.y}%`,
                                                    width: `${slot.w}%`,
                                                    height: `${slot.h}%`
                                                }}
                                            >
                                                {scene.panels[sIdx] && (
                                                    <img src={scene.panels[sIdx].imageUrl} alt="" className="w-full h-full object-cover filter contrast-125 saturate-150" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="bg-yellow-100 p-4 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transform rotate-1">
                                        <label htmlFor={`layout-${idx}`} className="block font-comic text-lg md:text-xl font-black uppercase mb-2 tracking-widest text-red-600">{t(lang, "LAYOUT")}</label>
                                        <select 
                                            id={`layout-${idx}`}
                                            value={scene.layout} 
                                            onChange={e => {
                                                const newScenes = [...scenes];
                                                newScenes[idx].layout = e.target.value;
                                                setScenes(newScenes);
                                            }}
                                            className="w-full p-3 border-4 border-black font-comic font-bold text-base md:text-lg bg-white focus:ring-4 focus:ring-red-500 outline-none cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                                            aria-label={`Layout for scene ${idx + 1}`}
                                        >
                                            {Object.keys(LAYOUT_TEMPLATES).filter(l => {
                                                const slots = LAYOUT_TEMPLATES[l].slots.length;
                                                return slots >= scene.panels.length;
                                            }).map(l => (
                                                <option key={l} value={l}>{l.replace('-', ' ').toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="bg-blue-100 p-4 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transform -rotate-1">
                                        <p className="font-comic text-lg md:text-xl font-black text-blue-800 uppercase mb-2 tracking-widest">{t(lang, "DESCRIPTION")}</p>
                                        <p className="font-sans font-bold text-sm md:text-base italic truncate bg-white p-3 border-4 border-black shadow-[inset_2px_2px_0px_rgba(0,0,0,0.1)]">{scene.panels.map(p => p.description).filter(Boolean).join(', ') || t(lang, "NO_DESCRIPTION")}</p>
                                    </div>
                                    
                                    <div className="bg-green-100 p-4 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transform rotate-1 sm:col-span-2 md:col-span-1">
                                        <label htmlFor={`duration-${idx}`} className="block font-comic text-lg md:text-xl font-black uppercase mb-2 tracking-widest text-green-800 flex justify-between items-center">
                                            <span>{t(lang, "DURATION")}</span>
                                            <span className="bg-black text-white px-2 py-1 text-sm">{(scene.duration / 1000).toFixed(1)}s</span>
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <input 
                                                id={`duration-${idx}`}
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
                                                className="flex-1 h-4 bg-gray-200 border-2 border-black rounded-none appearance-none cursor-pointer accent-red-500"
                                                aria-label={`Duration for scene ${idx + 1}`}
                                            />
                                            <input 
                                                type="number" 
                                                value={scene.duration} 
                                                onChange={e => {
                                                    const newScenes = [...scenes];
                                                    newScenes[idx].duration = parseInt(e.target.value) || 1000;
                                                    setScenes(newScenes);
                                                }}
                                                className="w-24 p-2 border-4 border-black font-comic text-base md:text-lg font-black text-center bg-white focus:ring-4 focus:ring-red-500 outline-none shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                                                aria-label={`Numeric duration for scene ${idx + 1}`}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="bg-pink-100 p-4 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transform -rotate-1 sm:col-span-2 md:col-span-1">
                                        <label htmlFor={`transition-${idx}`} className="block font-comic text-lg md:text-xl font-black uppercase mb-2 tracking-widest text-pink-800">{t(lang, "TRANSITION")}</label>
                                        <select 
                                            id={`transition-${idx}`}
                                            value={scene.transition} 
                                            onChange={e => {
                                                const newScenes = [...scenes];
                                                newScenes[idx].transition = e.target.value;
                                                setScenes(newScenes);
                                            }}
                                            className="w-full p-3 border-4 border-black font-comic font-bold text-base md:text-lg bg-white focus:ring-4 focus:ring-red-500 outline-none cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                                            aria-label={`Transition for scene ${idx + 1}`}
                                        >
                                            {TRANSITION_TYPES.map(t => (
                                                <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className="bg-purple-100 p-4 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transform rotate-1 sm:col-span-2">
                                        <label htmlFor={`intensity-${idx}`} className="block font-comic text-lg md:text-xl font-black uppercase mb-2 tracking-widest text-purple-800 flex justify-between items-center">
                                            <span>{t(lang, "ANIMATION_INTENSITY")}</span>
                                            <span className="bg-black text-white px-2 py-1 text-sm">{Math.round(scene.animationIntensity * 100)}%</span>
                                        </label>
                                        <input 
                                            id={`intensity-${idx}`}
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
                                            className="w-full h-4 bg-gray-200 border-2 border-black rounded-none appearance-none cursor-pointer accent-red-500"
                                            aria-label={`Animation intensity for scene ${idx + 1}`}
                                        />
                                    </div>

                                    <div className="bg-orange-100 p-4 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transform -rotate-1 sm:col-span-2">
                                        <label htmlFor={`sfx-${idx}`} className="block font-comic text-lg md:text-xl font-black uppercase mb-2 tracking-widest text-orange-800">{t(lang, "SFX")}</label>
                                        <div className="flex gap-4">
                                            <select 
                                                id={`sfx-${idx}`}
                                                value={scene.sfxId || 'none'} 
                                                onChange={e => {
                                                    const newScenes = [...scenes];
                                                    const sfx = SFX_LIBRARY.find(s => s.id === e.target.value);
                                                    newScenes[idx].sfxId = e.target.value;
                                                    newScenes[idx].sfxUrl = sfx?.url || '';
                                                    setScenes(newScenes);
                                                }}
                                                className="flex-1 p-3 border-4 border-black font-comic font-bold text-base md:text-lg bg-white focus:ring-4 focus:ring-red-500 outline-none cursor-pointer shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                                                aria-label={`Sound effect for scene ${idx + 1}`}
                                            >
                                                {SFX_LIBRARY.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
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
                                                className="px-6 border-4 border-black bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 active:scale-95 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] disabled:hover:translate-y-0 disabled:hover:translate-x-0 disabled:hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center justify-center"
                                                title={t(lang, "PREVIEW_SFX")}
                                                aria-label={`Preview sound effect for scene ${idx + 1}`}
                                            >
                                                <span className="text-3xl drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">🔊</span>
                                            </button>
                                        </div>
                                        {scene.sfxId !== 'none' && (
                                            <p className="font-comic text-sm md:text-base text-black font-black mt-4 uppercase tracking-widest bg-yellow-300 inline-block px-3 py-1 border-4 border-black transform rotate-2 shadow-[2px_2px_0px_rgba(0,0,0,1)]">{t(lang, "SUGGESTED_SFX")}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center pt-8 border-t-[8px] border-black relative z-10 bg-white p-6 mx-[-24px] md:mx-[-32px] mb-[-24px] md:mb-[-32px]">
                        <button 
                            onClick={() => setStep('idle')} 
                            className="px-8 py-4 border-[6px] border-black bg-white text-black font-comic font-black uppercase text-xl md:text-2xl shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] active:scale-95 transition-all transform rotate-1 tracking-widest"
                            aria-label="Back to general settings"
                        >{t(lang, "BACK")}</button>
                        <button 
                            onClick={generateVideo} 
                            className="px-8 py-4 border-[6px] border-black bg-red-500 text-white hover:bg-red-400 font-comic font-black uppercase text-xl md:text-2xl shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[10px_10px_0px_rgba(0,0,0,1)] active:scale-95 transition-all transform -rotate-1 tracking-widest"
                            aria-label="Generate final video"
                        >{t(lang, "GENERATE_FINAL")}</button>
                    </div>
                </div>
            )}

            {step === 'generating' && (
                <div 
                    className="bg-white p-8 md:p-12 border-[6px] md:border-[8px] border-black max-w-xl w-full text-center shadow-[12px_12px_0px_rgba(255,255,255,1)] md:shadow-[20px_20px_0px_rgba(255,255,255,1)] transform rotate-2 relative overflow-hidden"
                    role="status"
                    aria-live="polite"
                >
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2.5px)', backgroundSize: '10px 10px' }}></div>
                    <div className="w-24 h-24 md:w-32 md:h-32 border-[8px] md:border-[10px] border-black border-t-red-500 rounded-full animate-spin mx-auto mb-8 shadow-[4px_4px_0px_rgba(0,0,0,0.2)]"></div>
                    <h2 className="font-comic text-3xl md:text-4xl font-black mb-6 uppercase tracking-tighter text-black bg-yellow-400 inline-block px-4 py-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transform -skew-x-6">{t(lang, "GENERATING_VIDEO")}</h2>
                    <p className="font-sans font-bold text-gray-800 mb-8 text-base md:text-lg bg-white p-4 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transform rotate-1">{t(lang, "GENERATING_DESC")}</p>
                    <div className="w-full bg-white border-4 border-black h-8 md:h-10 rounded-none overflow-hidden relative shadow-[inset_4px_4px_0px_rgba(0,0,0,0.1)] transform -rotate-1">
                        <div 
                            className="h-full bg-red-500 transition-all duration-500 border-r-4 border-black" 
                            style={{ width: `${progress}%` }}
                            role="progressbar"
                            aria-valuenow={progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center font-comic text-lg md:text-xl font-black uppercase tracking-widest text-black mix-blend-overlay drop-shadow-[1px_1px_0_rgba(255,255,255,1)]">
                            {progress}%
                        </div>
                    </div>
                    <p className="font-comic font-black text-lg mt-6 uppercase tracking-tight text-black bg-blue-200 inline-block px-4 py-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transform rotate-2">{statusText}</p>
                </div>
            )}

            {step === 'error' && (
                <div 
                    className="bg-white p-8 md:p-12 border-[6px] md:border-[8px] border-black max-w-md w-full text-center shadow-[12px_12px_0px_rgba(255,255,255,1)] md:shadow-[20px_20px_0px_rgba(255,255,255,1)] transform -rotate-2 relative overflow-hidden"
                    role="alert"
                >
                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2.5px)', backgroundSize: '10px 10px' }}></div>
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 border-[6px] md:border-[8px] border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] transform rotate-6">
                        <span className="font-comic text-5xl md:text-6xl font-black drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">!</span>
                    </div>
                    <h2 className="font-comic text-3xl md:text-4xl font-black mb-4 uppercase text-black bg-red-400 inline-block px-4 py-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transform skew-x-6 tracking-tighter">{error?.title || t(lang, "ERROR")}</h2>
                    <p className="mb-8 font-sans font-bold text-gray-800 text-base md:text-lg bg-white p-4 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transform -rotate-1">{error?.message || t(lang, "UNEXPECTED_ERROR")}</p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
                        <button 
                            onClick={() => {
                                setError(null);
                                setStep('configuring');
                            }} 
                            className="px-8 py-3 border-[4px] border-black bg-gray-300 hover:bg-gray-200 font-comic font-black uppercase text-xl shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] active:scale-95 transition-all transform rotate-1"
                            aria-label="Return to configuration settings"
                        >
                            {t(lang, "BACK_TO_CONFIG")}
                        </button>
                        <button 
                            onClick={generateVideo} 
                            className="px-8 py-3 border-[4px] border-black bg-red-500 text-white hover:bg-red-400 font-comic font-black uppercase text-xl shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] active:scale-95 transition-all transform -rotate-1"
                            aria-label="Retry video generation"
                        >
                            {t(lang, "RETRY")}
                        </button>
                    </div>
                </div>
            )}

            {step === 'playing' && scenes.length > 0 && (
                <div 
                    className="flex flex-col items-center w-full max-w-5xl h-full md:h-auto"
                    role="region"
                    aria-labelledby="video-player-title"
                >
                    <h2 id="video-player-title" className="sr-only">{t(lang, "VIDEO_PLAYER")}</h2>
                    
                    <div className={`relative w-full bg-black border-[6px] md:border-[8px] border-black overflow-hidden shadow-[12px_12px_0px_rgba(255,255,255,1)] md:shadow-[20px_20px_0px_rgba(255,255,255,1)] transform rotate-1 ${aspectRatio === '16:9' ? 'aspect-video' : aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[60vh] md:max-h-[70vh]' : 'aspect-square max-h-[60vh] md:max-h-[70vh]'}`}>
                        <AnimatePresence mode="wait">
                        <motion.div 
                            key={currentSceneIndex}
                            {...renderTransition(scenes[currentSceneIndex].transition)}
                            transition={{ duration: scenes[currentSceneIndex].transition === 'cut' ? 0 : transitionDuration }}
                            className="absolute inset-0 flex items-center justify-center"
                            aria-live="polite"
                        >
                            {/* Layout Rendering */}
                            <div className="absolute inset-0 w-full h-full" aria-hidden="true">
                                {(LAYOUT_TEMPLATES[scenes[currentSceneIndex].layout] || LAYOUT_TEMPLATES.single).slots.map((slot, sIdx) => {
                                    const panel = scenes[currentSceneIndex].panels[sIdx];
                                    if (!panel) return null;
                                    return (
                                        <motion.div
                                            key={sIdx}
                                            className="absolute overflow-hidden border-[4px] md:border-[6px] border-black"
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
                                                className="w-full h-full object-cover filter contrast-125 saturate-150"
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
                            <div className="sr-only">
                                {scenes[currentSceneIndex].panels.map(p => p.description).join('. ')}
                            </div>
                            {scenes[currentSceneIndex].panels.flatMap(p => p.bubbles).map((bubble, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: 0.5 + (idx * 1.5), type: "spring", stiffness: 200, damping: 15 }}
                                    className="absolute bottom-8 md:bottom-12 left-6 md:left-12 right-6 md:right-12 bg-white text-black p-4 md:p-6 border-[4px] border-black font-comic text-xl md:text-2xl text-center font-black z-10 shadow-[8px_8px_0px_rgba(0,0,0,1)] transform -rotate-1 rounded-2xl rounded-bl-none"
                                    aria-live="assertive"
                                >
                                    {bubble.character && <span className="text-red-600 mr-3 uppercase tracking-tighter drop-shadow-[1px_1px_0_rgba(0,0,0,0.2)]">{bubble.character}:</span>}
                                    {bubble.text}
                                    <div className="absolute -bottom-[20px] left-[-4px] w-8 h-8 bg-white border-l-[4px] border-b-[4px] border-black transform -skew-x-[30deg] origin-top-left -z-10"></div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>

                    {/* Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black via-black/80 to-transparent flex justify-between items-center z-20">
                        <div className="text-white font-comic font-black text-xl md:text-2xl drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                            SCENE {currentSceneIndex + 1} / {scenes.length}
                        </div>
                        
                        {error && !error.fatal && (
                            <div className="absolute top-[-80px] left-4 right-4 bg-red-500 text-white p-3 border-4 border-black text-sm md:text-base font-comic font-black flex justify-between items-center animate-bounce shadow-[6px_6px_0px_rgba(0,0,0,1)] transform -rotate-1">
                                <span><span className="text-2xl drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">⚠️</span> {error.message}</span>
                                <button onClick={() => setError(null)} className="ml-4 bg-white text-black border-2 border-black px-2 py-1 hover:bg-gray-200 active:scale-95 shadow-[2px_2px_0px_rgba(0,0,0,1)]">X</button>
                            </div>
                        )}

                        <div className="flex gap-3 md:gap-4 items-center">
                            {isExporting ? (
                                <div className="text-black font-comic font-black text-sm md:text-base bg-yellow-400 px-4 py-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] transform rotate-1">
                                    {t(lang, "EXPORTING")}... {Math.round(exportProgress)}%
                                </div>
                            ) : (
                                <button 
                                    onClick={() => {
                                        stopPlayback();
                                        exportVideo();
                                    }} 
                                    className="bg-green-400 text-black border-4 border-black px-4 md:px-6 py-2 font-comic font-black text-sm md:text-base uppercase tracking-widest hover:bg-green-300 active:scale-95 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] transform -rotate-1"
                                    aria-label={t(lang, "EXPORT_VIDEO_DESC")}
                                >
                                    {t(lang, "EXPORT_WEBM")}
                                </button>
                            )}
                            <button 
                                onClick={() => {
                                    if (isPlaying) stopPlayback();
                                    else playScene(currentSceneIndex, scenes);
                                }} 
                                className="bg-white text-black border-4 border-black px-4 md:px-6 py-2 font-comic font-black text-sm md:text-base uppercase tracking-widest hover:bg-gray-200 active:scale-95 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] transform rotate-1"
                                aria-label={isPlaying ? t(lang, "PAUSE_VIDEO") : t(lang, "PLAY_VIDEO")}
                            >
                                {isPlaying ? t(lang, "PAUSE") : t(lang, "PLAY")}
                            </button>
                            <button 
                                onClick={onClose} 
                                className="bg-red-500 text-white border-4 border-black px-4 md:px-6 py-2 font-comic font-black text-sm md:text-base uppercase tracking-widest hover:bg-red-400 active:scale-95 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] transform -rotate-1"
                                aria-label={t(lang, "CLOSE_PLAYER")}
                            >
                                {t(lang, "CLOSE")}
                            </button>
                        </div>
                    </div>
                </div>
                </div>
            )}
        </div>
    );
};
