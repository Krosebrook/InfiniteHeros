
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GENRES, ART_STYLES, LANGUAGES, TONES, PANEL_LAYOUTS, PanelLayout, Persona } from './types';
import { soundManager } from './SoundManager';

interface SetupProps {
    show: boolean;
    isTransitioning: boolean;
    hero: Persona | null;
    friend: Persona | null;
    villain: Persona | null;
    selectedGenre: string;
    selectedArtStyle: string;
    selectedLanguage: string;
    selectedTone: string;
    selectedLayout: PanelLayout;
    customPremise: string;
    richMode: boolean;
    hasSave?: boolean;
    onResume?: () => void;
    onHeroUpload: (file: File) => Promise<void>;
    onFriendUpload: (file: File) => Promise<void>;
    onVillainUpload: (file: File) => Promise<void>;
    onAutoGenerateVillain: () => void;
    onAutoGenerateHero: () => void;
    onAutoGenerateFriend: () => void;
    onGenerateBios: () => void;
    onGenreChange: (val: string) => void;
    onArtStyleChange: (val: string) => void;
    onLanguageChange: (val: string) => void;
    onToneChange: (val: string) => void;
    onLayoutChange: (val: PanelLayout) => void;
    onPremiseChange: (val: string) => void;
    onRichModeChange: (val: boolean) => void;
    onLaunch: () => void;
    onToggleHeroLock: () => void;
    onToggleFriendLock: () => void;
    onToggleVillainLock: () => void;
}

// Map genres to recommended art styles for a more curated experience
const GENRE_STYLE_MAP: Record<string, string[]> = {
    "Classic Horror": ["Noir (High Contrast B&W)", "Painted (Alex Ross Style)", "Watercolor (Dreamy)", "Golden Age (Vintage 1940s)"],
    "Superhero Action": ["Modern American (Vibrant)", "Silver Age (Vintage 1960s)", "Painted (Alex Ross Style)"],
    "Dark Sci-Fi": ["European (Moebius Sci-Fi)", "Noir (High Contrast B&W)", "8-Bit Pixel Art", "Manga (Retro 90s Anime)"],
    "High Fantasy": ["Watercolor (Dreamy)", "Painted (Alex Ross Style)", "European (Moebius Sci-Fi)", "Franco-Belgian (Ligne Claire)"],
    "Neon Noir Detective": ["Noir (High Contrast B&W)", "Modern American (Vibrant)", "European (Moebius Sci-Fi)"],
    "Wasteland Apocalypse": ["Pulp Magazine (Rough)", "Noir (High Contrast B&W)", "Modern American (Vibrant)"],
    "Lighthearted Comedy": ["Franco-Belgian (Ligne Claire)", "Chalkboard Sketch", "Manga (Standard B&W)", "Paper Cutout (Collage)"],
    "Teen Drama / Slice of Life": ["Manga (Standard B&W)", "Watercolor (Dreamy)", "Franco-Belgian (Ligne Claire)"],
    "Custom": ART_STYLES
};

const Footer = () => {
  const [remixIndex, setRemixIndex] = useState(0);
  const remixes = [
    "Animate panels with Veo 3",
    "Localize to Klingon",
    "Print physical copies",
    "Add voice narration",
    "Create a shared universe"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setRemixIndex(prev => (prev + 1) % remixes.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black text-white py-2 px-4 flex flex-col md:flex-row justify-between items-center z-[300] border-t-4 border-yellow-400 font-comic">
        <div className="flex items-center gap-2 text-base md:text-lg">
            <span className="text-yellow-400 font-bold">REMIX IDEA:</span>
            <span className="animate-pulse">{remixes[remixIndex]}</span>
        </div>
        <div className="flex items-center gap-4 mt-2 md:mt-0">
            <span className="text-gray-500 text-xs hidden md:inline">Build with Gemini</span>
            <a href="https://x.com/ammaar" target="_blank" rel="noopener noreferrer" className="text-white hover:text-yellow-400 transition-colors text-lg">Created by @ammaar</a>
        </div>
    </div>
  );
};

interface CharacterUploaderProps {
    title: string;
    role: string;
    colorClass: string;
    borderColor: string;
    textColor: string;
    persona: Persona | null;
    onUpload: (file: File) => Promise<void>;
    onAutoGenerate: () => void;
    isRequired?: boolean;
    onToggleLock: () => void;
}

const CharacterUploader: React.FC<CharacterUploaderProps> = ({ 
    title, role, colorClass, borderColor, textColor, persona, onUpload, onAutoGenerate, isRequired, onToggleLock
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        soundManager.play('click');
        setError(null);

        if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
            setError("Format not supported. Use JPG/PNG.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("File too large (Max 5MB).");
            return;
        }

        setIsLoading(true);
        try {
            await onUpload(file);
            soundManager.play('pop');
        } catch (err) {
            console.error(err);
            setError("Upload failed. Try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="font-comic text-xl text-black border-b-4 border-black mb-1">{title}</div>
            
            <div className={`p-3 border-4 border-dashed ${persona ? 'border-green-500 bg-green-50' : `${borderColor} ${colorClass}`} transition-colors flex-1 flex flex-col relative`}>
                <div className="flex justify-between items-center mb-2">
                    <p className={`font-comic text-lg uppercase font-bold ${textColor}`}>{role}</p>
                    {persona ? (
                        <div className="flex items-center gap-2">
                            <span className="text-green-600 font-bold font-comic text-sm animate-pulse">✓ READY</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggleLock(); soundManager.play('click'); }}
                                className={`text-xl ${persona.locked ? 'grayscale-0' : 'grayscale opacity-50 hover:opacity-100'} transition-all`}
                                title={persona.locked ? "Character Locked (Will be used as reference)" : "Character Unlocked"}
                            >
                                {persona.locked ? '🔒' : '🔓'}
                            </button>
                        </div>
                    ) : (
                        !isLoading && <button 
                            onClick={() => { soundManager.play('click'); onAutoGenerate(); }} 
                            className="text-[10px] font-bold bg-black text-white px-2 py-1 hover:bg-gray-800 border border-transparent uppercase focus:outline-none focus:ring-4 focus:ring-yellow-400"
                            aria-label={`Auto-generate ${role}`}
                        >
                           AUTO-GENERATE
                        </button>
                    )}
                </div>

                {/* Error Banner with ARIA Live */}
                {error && (
                    <div className="bg-red-100 text-red-700 text-xs font-bold p-2 mb-2 border-l-4 border-red-500" role="alert" aria-live="polite">
                        ⚠️ {error}
                    </div>
                )}

                {isLoading && (
                    <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center backdrop-blur-sm" aria-live="assertive" aria-label="Analyzing image">
                        <div className="w-8 h-8 border-4 border-black border-t-yellow-400 rounded-full animate-spin mb-2" />
                        <span className="font-comic text-sm animate-pulse">ANALYZING IMAGE...</span>
                    </div>
                )}
                
                {persona ? (
                    <div className="flex flex-col items-center gap-2 mt-2">
                         <div className="relative">
                            <img src={`data:image/jpeg;base64,${persona.base64}`} alt={`Preview of ${persona.name}`} className={`w-24 h-24 object-cover border-2 border-black rotate-[-2deg] shadow-sm ${persona.locked ? 'ring-4 ring-yellow-400' : ''}`} />
                            {persona.locked && <div className="absolute -top-2 -right-2 text-xl drop-shadow-md">🔒</div>}
                         </div>
                         
                         {persona.name && (
                             <div className="bg-yellow-100 p-2 border border-black w-full text-left rotate-1">
                                 <p className="font-comic text-lg leading-none">{persona.name}</p>
                                 <p className="font-sans text-[10px] leading-tight text-gray-600 line-clamp-3">{persona.backstory}</p>
                             </div>
                         )}

                         <div className="flex w-full gap-2">
                            <label 
                                className={`cursor-pointer comic-btn bg-yellow-400 text-black text-xs px-2 py-2 hover:bg-yellow-300 flex-1 text-center focus-within:ring-4 focus-within:ring-black ${persona.locked ? 'opacity-50 pointer-events-none' : ''}`} 
                                tabIndex={persona.locked ? -1 : 0} 
                                onKeyDown={!persona.locked ? handleKeyDown : undefined}
                                role="button"
                                aria-label={`Replace ${role} image`}
                            >
                                REPLACE
                                <input 
                                    ref={inputRef} 
                                    type="file" 
                                    accept="image/png, image/jpeg, image/webp" 
                                    className="sr-only" 
                                    onChange={handleFileChange} 
                                    disabled={isLoading || !!persona.locked} 
                                />
                            </label>
                            <button 
                                className={`comic-btn bg-white text-black text-xs px-2 py-2 hover:bg-gray-100 flex-1 text-center ${persona.locked ? 'opacity-50 pointer-events-none' : ''}`}
                                onClick={() => { if(!persona.locked) { soundManager.play('click'); onAutoGenerate(); }}}
                                aria-label={`Regenerate ${role} details`}
                                disabled={!!persona.locked}
                            >
                                REGENERATE
                            </button>
                         </div>
                    </div>
                ) : (
                    <label 
                        className={`comic-btn ${isRequired ? 'bg-blue-500 text-white hover:bg-blue-400' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'} text-lg px-3 py-6 block w-full cursor-pointer text-center h-full flex items-center justify-center flex-col transition-colors focus-within:ring-4 focus-within:ring-yellow-400`} 
                        tabIndex={0} 
                        onKeyDown={handleKeyDown}
                        role="button"
                        aria-label={`Upload image for ${role}`}
                    >
                        <span className="text-3xl mb-2" aria-hidden="true">📁</span>
                        <span>UPLOAD IMAGE</span>
                        <span className="text-xs font-sans opacity-70 mt-1">JPG, PNG (Max 5MB)</span>
                        <input 
                            ref={inputRef} 
                            type="file" 
                            accept="image/png, image/jpeg, image/webp" 
                            className="sr-only" 
                            onChange={handleFileChange} 
                            disabled={isLoading} 
                        />
                    </label>
                )}
            </div>
        </div>
    );
};

export const Setup: React.FC<SetupProps> = (props) => {
    // Filter art styles based on selected genre
    const filteredStyles = useMemo(() => {
        return GENRE_STYLE_MAP[props.selectedGenre] || ART_STYLES;
    }, [props.selectedGenre]);

    // Update art style if current one isn't in filtered list
    useEffect(() => {
        if (filteredStyles.length > 0 && !filteredStyles.includes(props.selectedArtStyle)) {
            props.onArtStyleChange(filteredStyles[0]);
        }
    }, [props.selectedGenre, filteredStyles]);

    if (!props.show && !props.isTransitioning) return null;

    const playClick = () => soundManager.play('click');

    return (
        <>
        <style>{`
             @keyframes knockout-exit {
                0% { transform: scale(1) rotate(1deg); }
                15% { transform: scale(1.1) rotate(-5deg); }
                100% { transform: translateY(-200vh) rotate(1080deg) scale(0.5); opacity: 1; }
             }
             @keyframes pow-enter {
                 0% { transform: translate(-50%, -50%) scale(0) rotate(-45deg); opacity: 0; }
                 30% { transform: translate(-50%, -50%) scale(1.5) rotate(10deg); opacity: 1; }
                 100% { transform: translate(-50%, -50%) scale(1.8) rotate(0deg); opacity: 0; }
             }
          `}</style>
        {props.isTransitioning && (
            <div className="fixed top-1/2 left-1/2 z-[210] pointer-events-none" style={{ animation: 'pow-enter 1s forwards ease-out' }}>
                <svg viewBox="0 0 200 150" className="w-[500px] h-[400px] drop-shadow-[0_10px_0_rgba(0,0,0,0.5)]">
                    <path d="M95.7,12.8 L110.2,48.5 L148.5,45.2 L125.6,74.3 L156.8,96.8 L119.4,105.5 L122.7,143.8 L92.5,118.6 L60.3,139.7 L72.1,103.2 L34.5,108.8 L59.9,79.9 L24.7,57.3 L62.5,54.4 L61.2,16.5 z" fill="#FFD700" stroke="black" strokeWidth="4"/>
                    <text x="100" y="95" textAnchor="middle" fontFamily="'Bangers', cursive" fontSize="70" fill="#DC2626" stroke="black" strokeWidth="2" transform="rotate(-5 100 75)">POW!</text>
                </svg>
            </div>
        )}
        
        <div className={`fixed inset-0 z-[200] overflow-y-auto`}
             style={{
                 background: props.isTransitioning ? 'transparent' : 'rgba(0,0,0,0.85)', 
                 backdropFilter: props.isTransitioning ? 'none' : 'blur(6px)',
                 animation: props.isTransitioning ? 'knockout-exit 1s forwards cubic-bezier(.6,-0.28,.74,.05)' : 'none',
                 pointerEvents: props.isTransitioning ? 'none' : 'auto'
             }}>
          <div className="min-h-full flex items-center justify-center p-4 pb-20">
            <div className="max-w-[1100px] w-full bg-white p-4 md:p-6 rotate-1 border-[6px] border-black shadow-[12px_12px_0px_rgba(0,0,0,0.6)] text-center relative">
                
                <h1 className="font-comic text-5xl md:text-6xl text-red-600 leading-none mb-1 tracking-wide inline-block mr-3" style={{textShadow: '3px 3px 0px black'}}>INFINITE</h1>
                <h1 className="font-comic text-5xl md:text-6xl text-yellow-400 leading-none mb-6 tracking-wide inline-block" style={{textShadow: '3px 3px 0px black'}}>HEROES</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-left">
                    
                    <CharacterUploader 
                        title="1. THE HERO"
                        role="REQUIRED HERO"
                        colorClass="bg-blue-50"
                        borderColor="border-blue-300"
                        textColor="text-blue-900"
                        persona={props.hero}
                        onUpload={props.onHeroUpload}
                        onAutoGenerate={props.onAutoGenerateHero}
                        isRequired={true}
                        onToggleLock={props.onToggleHeroLock}
                    />

                    <CharacterUploader 
                        title="2. THE SIDEKICK"
                        role="OPTIONAL ALLY"
                        colorClass="bg-purple-50"
                        borderColor="border-purple-300"
                        textColor="text-purple-900"
                        persona={props.friend}
                        onUpload={props.onFriendUpload}
                        onAutoGenerate={props.onAutoGenerateFriend}
                        onToggleLock={props.onToggleFriendLock}
                    />

                    <div className="flex flex-col gap-3">
                         <CharacterUploader 
                            title="3. THE VILLAIN"
                            role="OPTIONAL THREAT"
                            colorClass="bg-red-50"
                            borderColor="border-red-500"
                            textColor="text-red-900"
                            persona={props.villain}
                            onUpload={props.onVillainUpload}
                            onAutoGenerate={props.onAutoGenerateVillain}
                            onToggleLock={props.onToggleVillainLock}
                        />
                        <button onClick={() => { playClick(); props.onGenerateBios(); }} 
                                className="comic-btn bg-white text-black text-sm px-4 py-2 hover:bg-gray-100 flex items-center justify-center gap-2 mt-auto"
                                disabled={!props.hero}>
                            <span>✨</span> GENERATE NAMES & BACKSTORIES
                        </button>
                    </div>

                    {/* COL 4 (Actually 3 in grid but handled by layout): SETTINGS */}
                </div>
                
                {/* SETTINGS AREA */}
                <div className="mb-6 p-4 bg-yellow-50 border-4 border-black text-left grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     <div>
                        <label htmlFor="genre-select" className="font-comic text-sm mb-1 font-bold text-gray-800 block">GENRE</label>
                        <select id="genre-select" value={props.selectedGenre} onChange={(e) => { playClick(); props.onGenreChange(e.target.value); }} className="w-full font-comic text-base p-1 border-2 border-black uppercase bg-white cursor-pointer shadow-sm focus:outline-none focus:ring-4 focus:ring-yellow-400">
                            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="style-select" className="font-comic text-sm mb-1 font-bold text-gray-800 block">ART STYLE</label>
                        <select id="style-select" value={props.selectedArtStyle} onChange={(e) => { playClick(); props.onArtStyleChange(e.target.value); }} className="w-full font-comic text-base p-1 border-2 border-black uppercase bg-white cursor-pointer shadow-sm focus:outline-none focus:ring-4 focus:ring-yellow-400">
                            {filteredStyles.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="lang-select" className="font-comic text-sm mb-1 font-bold text-gray-800 block">LANGUAGE</label>
                        <select id="lang-select" value={props.selectedLanguage} onChange={(e) => { playClick(); props.onLanguageChange(e.target.value); }} className="w-full font-comic text-base p-1 border-2 border-black uppercase bg-white cursor-pointer shadow-sm focus:outline-none focus:ring-4 focus:ring-yellow-400">
                            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="layout-select" className="font-comic text-sm mb-1 font-bold text-gray-800 block">LAYOUT</label>
                        <select id="layout-select" value={props.selectedLayout} onChange={(e) => { playClick(); props.onLayoutChange(e.target.value as PanelLayout); }} className="w-full font-comic text-base p-1 border-2 border-black uppercase bg-white cursor-pointer shadow-sm focus:outline-none focus:ring-4 focus:ring-yellow-400">
                            {PANEL_LAYOUTS.map(l => <option key={l} value={l}>{l.replace('_', ' ').toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col lg:col-span-2">
                        <label htmlFor="tone-select" className="font-comic text-sm mb-1 font-bold text-gray-800 block">STORY TONE</label>
                        <select id="tone-select" value={props.selectedTone} onChange={(e) => { playClick(); props.onToneChange(e.target.value); }} className="w-full font-comic text-base p-1 border-2 border-black uppercase bg-white cursor-pointer shadow-sm focus:outline-none focus:ring-4 focus:ring-yellow-400">
                            {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        {props.selectedGenre === 'Custom' && (
                            <textarea 
                                value={props.customPremise} 
                                onChange={(e) => props.onPremiseChange(e.target.value)} 
                                placeholder="Story Premise..." 
                                className="w-full p-1 border-2 border-black font-comic text-sm h-12 resize-none mt-2 focus:outline-none focus:ring-4 focus:ring-yellow-400" 
                                aria-label="Custom Story Premise"
                            />
                        )}
                    </div>
                </div>

                <div className="flex gap-4 w-full">
                    {props.hasSave && (
                        <button onClick={() => { playClick(); props.onResume?.(); }} className="comic-btn bg-green-500 text-white text-xl px-4 py-4 hover:bg-green-400 flex-1 uppercase tracking-wider shadow-[8px_8px_0px_black]">
                             Resume Adventure
                        </button>
                    )}
                    <button onClick={() => { playClick(); props.onLaunch(); }} disabled={!props.hero || props.isTransitioning} className="comic-btn bg-red-600 text-white text-4xl px-8 py-4 flex-[2] hover:bg-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed uppercase tracking-wider shadow-[8px_8px_0px_black] hover:shadow-[10px_10px_0px_black]">
                        {props.isTransitioning ? 'INKING PAGES...' : 'START ADVENTURE!'}
                    </button>
                </div>
            </div>
          </div>
        </div>

        <Footer />
        </>
    );
}
