
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GENRES, ART_STYLES, LANGUAGES, TONES, PANEL_LAYOUTS, PanelLayout, Persona } from './types';
import { soundManager } from './SoundManager';
import { t } from './translations';

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
    onUpdateHero: (p: Persona) => void;
    onUpdateFriend: (p: Persona) => void;
    onUpdateVillain: (p: Persona) => void;
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
    lang: string;
    onUpdatePersona?: (updated: Persona) => void;
}

const CharacterUploader: React.FC<CharacterUploaderProps> = ({ 
    title, role, colorClass, borderColor, textColor, persona, onUpload, onAutoGenerate, isRequired, onToggleLock, lang, onUpdatePersona
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editBackstory, setEditBackstory] = useState("");
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (persona) {
            setEditName(persona.name || "");
            setEditBackstory(persona.backstory || "");
        }
    }, [persona]);

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

    const handleAutoGenerate = async () => {
        soundManager.play('click');
        setIsGenerating(true);
        try {
            await onAutoGenerate();
        } catch (err) {
            console.error(err);
            setError("Generation failed.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
        }
    };

    return (
        <section className="flex flex-col gap-3 relative" aria-labelledby={`${title.replace(/\s+/g, '-').toLowerCase()}-title`}>
            <div className="absolute -top-3 -left-3 bg-black text-white px-3 py-1 font-comic text-lg uppercase transform -rotate-3 border-2 border-white shadow-md z-20">
                <h2 id={`${title.replace(/\s+/g, '-').toLowerCase()}-title`}>{title}</h2>
            </div>
            
            <div className={`p-4 border-4 border-black ${persona ? 'bg-green-50' : `${borderColor} ${colorClass}`} shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-colors flex-1 flex flex-col relative mt-2`}>
                <div className="flex justify-between items-center mb-4">
                    <p className={`font-comic text-xl uppercase font-bold ${textColor} tracking-wider`}>{role}</p>
                    {persona ? (
                        <div className="flex items-center gap-2 bg-white border-2 border-black px-2 py-1 transform rotate-2">
                            <span className="text-green-600 font-bold font-comic text-sm animate-pulse" aria-label="Character ready">✓ READY</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onToggleLock(); soundManager.play('click'); }}
                                className={`text-xl ${persona.locked ? 'grayscale-0' : 'grayscale opacity-50 hover:opacity-100'} transition-all`}
                                title={persona.locked ? "Character Locked (Will be used as reference)" : "Character Unlocked (Will be regenerated if story changes)"}
                                aria-label={persona.locked ? "Unlock character" : "Lock character"}
                            >
                                {persona.locked ? '🔒' : '🔓'}
                            </button>
                        </div>
                    ) : (
                        !(isLoading || isGenerating) && <button 
                            onClick={handleAutoGenerate} 
                            className="text-xs font-bold bg-black text-white px-3 py-2 hover:bg-gray-800 border-2 border-transparent uppercase focus:outline-none focus:ring-4 focus:ring-yellow-400 shadow-[2px_2px_0px_rgba(0,0,0,0.5)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                            aria-label={`Auto-generate ${role} from genre prompts`}
                            title={`Auto-generate ${role}`}
                        >
                           {t(lang, "AUTO_GENERATE")}
                        </button>
                    )}
                </div>

                {/* Error Banner with ARIA Live */}
                {error && (
                    <div className="bg-red-100 text-red-700 text-xs font-bold p-2 mb-2 border-l-4 border-red-500" role="alert" aria-live="polite">
                        ⚠️ {error}
                    </div>
                )}

                {(isLoading || isGenerating) && (
                    <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center backdrop-blur-sm" aria-live="assertive" aria-label={isLoading ? "Analyzing image" : "Generating character"}>
                        <div className="w-8 h-8 border-4 border-black border-t-yellow-400 rounded-full animate-spin mb-2" />
                        <span className="font-comic text-sm animate-pulse">{isLoading ? "ANALYZING IMAGE..." : "GENERATING..."}</span>
                    </div>
                )}
                
                {persona ? (
                    <div className="flex flex-col items-center gap-2 mt-2">
                         <div className="relative">
                            <img src={`data:image/jpeg;base64,${persona.base64}`} alt={`Preview of ${persona.name}`} className={`w-24 h-24 object-cover border-2 border-black rotate-[-2deg] shadow-sm ${persona.locked ? 'ring-4 ring-yellow-400' : ''}`} />
                            {persona.locked && <div className="absolute -top-2 -right-2 text-xl drop-shadow-md">🔒</div>}
                         </div>
                         
                         {persona.name && (
                             <div className="bg-yellow-100 p-2 border border-black w-full text-left rotate-1 relative group">
                                 {isEditing ? (
                                     <div className="flex flex-col gap-1">
                                         <input 
                                             type="text" 
                                             value={editName} 
                                             onChange={(e) => setEditName(e.target.value)} 
                                             className="font-comic text-sm border-2 border-black p-1 w-full"
                                             placeholder="Character Name"
                                         />
                                         <textarea 
                                             value={editBackstory} 
                                             onChange={(e) => setEditBackstory(e.target.value)} 
                                             className="font-sans text-[10px] border-2 border-black p-1 w-full resize-none h-16"
                                             placeholder="Character Backstory"
                                         />
                                         <div className="flex gap-1 mt-1">
                                             <button 
                                                 onClick={() => {
                                                     if (onUpdatePersona) {
                                                         onUpdatePersona({ ...persona, name: editName, backstory: editBackstory, desc: editBackstory });
                                                     }
                                                     setIsEditing(false);
                                                 }}
                                                 className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 border-2 border-black hover:bg-green-400 flex-1"
                                             >
                                                 SAVE
                                             </button>
                                             <button 
                                                 onClick={() => {
                                                     setEditName(persona.name || "");
                                                     setEditBackstory(persona.backstory || "");
                                                     setIsEditing(false);
                                                 }}
                                                 className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 border-2 border-black hover:bg-red-400 flex-1"
                                             >
                                                 CANCEL
                                             </button>
                                         </div>
                                     </div>
                                 ) : (
                                     <>
                                         <p className="font-comic text-lg leading-none">{persona.name}</p>
                                         <p className="font-sans text-[10px] leading-tight text-gray-600 line-clamp-3">{persona.backstory}</p>
                                         {!persona.locked && onUpdatePersona && (
                                             <button 
                                                 onClick={() => setIsEditing(true)}
                                                 className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-white border border-black p-1 text-xs hover:bg-gray-200 transition-opacity"
                                                 aria-label="Edit character details"
                                             >
                                                 ✏️
                                             </button>
                                         )}
                                     </>
                                 )}
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
                                {t(lang, "REPLACE")}
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
                                onClick={() => { if(!persona.locked) { handleAutoGenerate(); }}}
                                aria-label={`Regenerate ${role} details`}
                                disabled={!!persona.locked || isGenerating}
                            >
                                {t(lang, "REGENERATE")}
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
                        <span>{t(lang, "UPLOAD_IMAGE")}</span>
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
        </section>
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
             role="dialog"
             aria-modal="true"
             aria-labelledby="setup-title"
             style={{
                 background: props.isTransitioning ? 'transparent' : 'rgba(0,0,0,0.85)', 
                 backdropFilter: props.isTransitioning ? 'none' : 'blur(6px)',
                 animation: props.isTransitioning ? 'knockout-exit 1s forwards cubic-bezier(.6,-0.28,.74,.05)' : 'none',
                 pointerEvents: props.isTransitioning ? 'none' : 'auto'
             }}>
          <div className="min-h-full flex items-center justify-center p-2 md:p-4 pb-24 md:pb-20">
            <div className="max-w-[1100px] w-full bg-white p-4 md:p-8 rotate-1 border-[4px] md:border-[8px] border-black shadow-[12px_12px_0px_rgba(0,0,0,1)] md:shadow-[20px_20px_0px_rgba(0,0,0,1)] text-center relative overflow-hidden">
                
                {/* Comic Book Halftone Background Pattern */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2.5px)', backgroundSize: '12px 12px' }}></div>

                <header id="setup-title" className="relative z-10 mb-6">
                    <div className="inline-block bg-black px-6 py-2 transform -skew-x-12 shadow-[6px_6px_0px_#EF4444]">
                        <h1 className="font-comic text-4xl md:text-7xl text-white leading-none tracking-wider uppercase">{t(props.selectedLanguage, "INFINITE")} <span className="text-yellow-400">{t(props.selectedLanguage, "HEROES")}</span></h1>
                    </div>
                </header>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mb-8 text-left relative z-10">
                    
                    <CharacterUploader 
                        title={t(props.selectedLanguage, "THE_HERO")}
                        role={t(props.selectedLanguage, "REQUIRED_HERO")}
                        colorClass="bg-blue-50"
                        borderColor="border-blue-300"
                        textColor="text-blue-900"
                        persona={props.hero}
                        onUpload={props.onHeroUpload}
                        onAutoGenerate={props.onAutoGenerateHero}
                        isRequired={true}
                        onToggleLock={props.onToggleHeroLock}
                        lang={props.selectedLanguage}
                        onUpdatePersona={props.onUpdateHero}
                    />

                    <CharacterUploader 
                        title={t(props.selectedLanguage, "THE_SIDEKICK")}
                        role={t(props.selectedLanguage, "OPTIONAL_ALLY")}
                        colorClass="bg-purple-50"
                        borderColor="border-purple-300"
                        textColor="text-purple-900"
                        persona={props.friend}
                        onUpload={props.onFriendUpload}
                        onAutoGenerate={props.onAutoGenerateFriend}
                        onToggleLock={props.onToggleFriendLock}
                        lang={props.selectedLanguage}
                        onUpdatePersona={props.onUpdateFriend}
                    />

                    <div className="flex flex-col gap-3">
                         <CharacterUploader 
                            title={t(props.selectedLanguage, "THE_VILLAIN")}
                            role={t(props.selectedLanguage, "OPTIONAL_THREAT")}
                            colorClass="bg-red-50"
                            borderColor="border-red-500"
                            textColor="text-red-900"
                            persona={props.villain}
                            onUpload={props.onVillainUpload}
                            onAutoGenerate={props.onAutoGenerateVillain}
                            onToggleLock={props.onToggleVillainLock}
                            lang={props.selectedLanguage}
                            onUpdatePersona={props.onUpdateVillain}
                        />
                        <button onClick={() => { playClick(); props.onGenerateBios(); }} 
                                className="comic-btn bg-white text-black text-sm px-4 py-2 hover:bg-gray-100 flex items-center justify-center gap-2 mt-auto"
                                disabled={!props.hero}>
                            {t(props.selectedLanguage, "GENERATE_NAMES")}
                        </button>
                    </div>

                    {/* COL 4 (Actually 3 in grid but handled by layout): SETTINGS */}
                </div>
                
                {/* SETTINGS AREA */}
                <div className="mb-8 p-6 bg-yellow-50 border-4 border-black text-left grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 shadow-[8px_8px_0px_rgba(0,0,0,1)] relative z-10 transform -rotate-1">
                     <div className="absolute -top-4 -left-4 bg-black text-white px-3 py-1 font-comic text-lg uppercase transform -rotate-6 border-2 border-white shadow-md">World Settings</div>
                     <div>
                        <label htmlFor="genre-select" className="font-comic text-lg mb-1 font-bold text-gray-800 block uppercase tracking-wide">{t(props.selectedLanguage, "GENRE")}</label>
                        <select id="genre-select" value={props.selectedGenre} onChange={(e) => { playClick(); props.onGenreChange(e.target.value); }} className="w-full font-comic text-lg p-2 border-4 border-black uppercase bg-white text-black cursor-pointer shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400">
                            {GENRES.map(g => <option key={g} value={g} className="text-black bg-white">{g}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="style-select" className="font-comic text-lg mb-1 font-bold text-gray-800 block uppercase tracking-wide">{t(props.selectedLanguage, "ART_STYLE")}</label>
                        <select id="style-select" value={props.selectedArtStyle} onChange={(e) => { playClick(); props.onArtStyleChange(e.target.value); }} className="w-full font-comic text-lg p-2 border-4 border-black uppercase bg-white text-black cursor-pointer shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400">
                            {filteredStyles.map(s => <option key={s} value={s} className="text-black bg-white">{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="lang-select" className="font-comic text-lg mb-1 font-bold text-gray-800 block uppercase tracking-wide">{t(props.selectedLanguage, "LANGUAGE")}</label>
                        <select id="lang-select" value={props.selectedLanguage} onChange={(e) => { playClick(); props.onLanguageChange(e.target.value); }} className="w-full font-comic text-lg p-2 border-4 border-black uppercase bg-white text-black cursor-pointer shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400">
                            {LANGUAGES.map(l => <option key={l.code} value={l.code} className="text-black bg-white">{l.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="layout-select" className="font-comic text-lg mb-1 font-bold text-gray-800 block uppercase tracking-wide">{t(props.selectedLanguage, "LAYOUT")}</label>
                        <select id="layout-select" value={props.selectedLayout} onChange={(e) => { playClick(); props.onLayoutChange(e.target.value as PanelLayout); }} className="w-full font-comic text-lg p-2 border-4 border-black uppercase bg-white text-black cursor-pointer shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400">
                            {PANEL_LAYOUTS.map(l => <option key={l} value={l} className="text-black bg-white">{l.replace('_', ' ').toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col lg:col-span-2">
                        <label htmlFor="tone-select" className="font-comic text-lg mb-1 font-bold text-gray-800 block uppercase tracking-wide">{t(props.selectedLanguage, "STORY_TONE")}</label>
                        <select id="tone-select" value={props.selectedTone} onChange={(e) => { playClick(); props.onToneChange(e.target.value); }} className="w-full font-comic text-lg p-2 border-4 border-black uppercase bg-white text-black cursor-pointer shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all focus:outline-none focus:ring-4 focus:ring-yellow-400">
                            {TONES.map(t => <option key={t} value={t} className="text-black bg-white">{t}</option>)}
                        </select>

                        {props.selectedGenre === 'Custom' && (
                            <textarea 
                                value={props.customPremise} 
                                onChange={(e) => props.onPremiseChange(e.target.value)} 
                                placeholder="Story Premise..." 
                                className="w-full p-3 border-4 border-black font-comic text-lg h-24 resize-none mt-4 text-black shadow-[4px_4px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-4 focus:ring-yellow-400" 
                                aria-label="Custom Story Premise"
                            />
                        )}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full">
                    {props.hasSave && (
                        <button onClick={() => { playClick(); props.onResume?.(); }} className="comic-btn bg-green-500 text-white text-xl px-4 py-4 hover:bg-green-400 flex-1 uppercase tracking-wider shadow-[8px_8px_0px_black] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all" title="Resume your previous adventure">
                             {t(props.selectedLanguage, "RESUME_ADVENTURE")}
                        </button>
                    )}
                    <button onClick={() => { playClick(); props.onLaunch(); }} disabled={!props.hero || props.isTransitioning} className="comic-btn bg-red-600 text-white text-3xl md:text-4xl px-8 py-4 flex-[2] hover:bg-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed uppercase tracking-wider shadow-[8px_8px_0px_black] hover:shadow-[10px_10px_0px_black] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all" title="Start a new adventure">
                        {props.isTransitioning ? t(props.selectedLanguage, "INKING_PAGES") : t(props.selectedLanguage, "START_ADVENTURE")}
                    </button>
                </div>
            </div>
          </div>
        </div>
        </>
    );
}
