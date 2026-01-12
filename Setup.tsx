
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { GENRES, ART_STYLES, LANGUAGES, Persona } from './types';
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
    customPremise: string;
    richMode: boolean;
    hasSave?: boolean;
    onResume?: () => void;
    onHeroUpload: (file: File) => void;
    onFriendUpload: (file: File) => void;
    onVillainUpload: (file: File) => void;
    onAutoGenerateVillain: () => void;
    onAutoGenerateHero: () => void;
    onAutoGenerateFriend: () => void;
    onGenerateBios: () => void;
    onGenreChange: (val: string) => void;
    onArtStyleChange: (val: string) => void;
    onLanguageChange: (val: string) => void;
    onPremiseChange: (val: string) => void;
    onRichModeChange: (val: boolean) => void;
    onLaunch: () => void;
}

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

export const Setup: React.FC<SetupProps> = (props) => {
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
            {/* Wider Container for 3 cols */}
            <div className="max-w-[1100px] w-full bg-white p-4 md:p-6 rotate-1 border-[6px] border-black shadow-[12px_12px_0px_rgba(0,0,0,0.6)] text-center relative">
                
                <h1 className="font-comic text-5xl md:text-6xl text-red-600 leading-none mb-1 tracking-wide inline-block mr-3" style={{textShadow: '3px 3px 0px black'}}>INFINITE</h1>
                <h1 className="font-comic text-5xl md:text-6xl text-yellow-400 leading-none mb-6 tracking-wide inline-block" style={{textShadow: '3px 3px 0px black'}}>HEROES</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-left">
                    
                    {/* COL 1: HERO */}
                    <div className="flex flex-col gap-3">
                        <div className="font-comic text-xl text-black border-b-4 border-black mb-1">1. THE HERO</div>
                        
                        <div className={`p-3 border-4 border-dashed ${props.hero ? 'border-green-500 bg-green-50' : 'border-blue-300 bg-blue-50'} transition-colors flex-1 flex flex-col`}>
                            <div className="flex justify-between items-center mb-2">
                                <p className="font-comic text-lg uppercase font-bold text-blue-900">REQUIRED</p>
                                {props.hero ? (
                                    <span className="text-green-600 font-bold font-comic text-sm animate-pulse">✓ READY</span>
                                ) : (
                                    <button onClick={() => { playClick(); props.onAutoGenerateHero(); }} className="text-[10px] font-bold bg-black text-white px-2 py-1 hover:bg-gray-800 border border-transparent uppercase">
                                       AUTO-GENERATE
                                    </button>
                                )}
                            </div>
                            
                            {props.hero ? (
                                <div className="flex flex-col items-center gap-2 mt-2">
                                     <img src={`data:image/jpeg;base64,${props.hero.base64}`} alt="Hero" className="w-24 h-24 object-cover border-2 border-black rotate-[-2deg] shadow-sm" />
                                     
                                     {props.hero.name && (
                                         <div className="bg-yellow-100 p-2 border border-black w-full text-left rotate-1">
                                             <p className="font-comic text-lg leading-none">{props.hero.name}</p>
                                             <p className="font-sans text-[10px] leading-tight text-gray-600 line-clamp-3">{props.hero.backstory}</p>
                                         </div>
                                     )}

                                     <div className="flex w-full gap-2">
                                        <label className="cursor-pointer comic-btn bg-yellow-400 text-black text-xs px-2 py-2 hover:bg-yellow-300 flex-1 text-center" onClick={playClick}>
                                            UPLOAD
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => { playClick(); e.target.files?.[0] && props.onHeroUpload(e.target.files[0]); }} />
                                        </label>
                                        <button className="comic-btn bg-white text-black text-xs px-2 py-2 hover:bg-gray-100 flex-1 text-center" onClick={() => { playClick(); props.onAutoGenerateHero(); }}>
                                            REGENERATE
                                        </button>
                                     </div>
                                </div>
                            ) : (
                                <label className="comic-btn bg-blue-500 text-white text-lg px-3 py-6 block w-full hover:bg-blue-400 cursor-pointer text-center h-full flex items-center justify-center" onClick={playClick}>
                                    UPLOAD HERO 
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { playClick(); e.target.files?.[0] && props.onHeroUpload(e.target.files[0]); }} />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* COL 2: SUPPORTING CAST */}
                    <div className="flex flex-col gap-3">
                        <div className="font-comic text-xl text-black border-b-4 border-black mb-1">2. THE CAST</div>
                        
                        {/* CO-STAR */}
                        <div className={`p-2 border-2 border-dashed ${props.friend ? 'border-green-500 bg-green-50' : 'border-purple-300 bg-purple-50'}`}>
                            <div className="flex justify-between items-center">
                                <p className="font-comic text-sm uppercase font-bold text-purple-900">CO-STAR (OPTIONAL)</p>
                                <div className="flex gap-1">
                                    {!props.friend && (
                                        <button onClick={() => { playClick(); props.onAutoGenerateFriend(); }} className="text-[10px] font-bold bg-black text-white px-2 py-1 hover:bg-gray-800 border border-transparent uppercase">
                                            AUTO
                                        </button>
                                    )}
                                    <label className="text-[10px] font-bold bg-purple-200 px-2 py-1 border border-black cursor-pointer hover:bg-purple-100 flex items-center" onClick={playClick}>
                                        {props.friend ? 'CHANGE' : 'UPLOAD'}
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => props.onFriendUpload(e.target.files![0])} />
                                    </label>
                                </div>
                            </div>
                            {props.friend && (
                                <div className="flex flex-col gap-1 mt-1">
                                    <div className="flex items-center gap-2">
                                        <img src={`data:image/jpeg;base64,${props.friend.base64}`} className="w-10 h-10 object-cover border border-black" alt="Friend"/>
                                        <button onClick={() => { playClick(); props.onAutoGenerateFriend(); }} className="text-[10px] underline text-gray-500 hover:text-black">Regenerate</button>
                                    </div>
                                    {props.friend.name && (
                                        <div className="bg-white p-1 border border-gray-300">
                                             <p className="font-comic text-xs font-bold">{props.friend.name}</p>
                                             <p className="font-sans text-[8px] leading-tight text-gray-600 line-clamp-2">{props.friend.backstory}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                         {/* VILLAIN */}
                         <div className={`p-2 border-2 border-dashed ${props.villain ? 'border-red-500 bg-red-50' : 'border-gray-400 bg-gray-50'} flex flex-col gap-1`}>
                            <div className="flex justify-between items-center">
                                <p className="font-comic text-sm uppercase font-bold text-red-900">THE VILLAIN</p>
                                {props.villain ? (
                                     <span className="text-[10px] font-bold text-green-600">✓ READY</span>
                                ) : (
                                     <button onClick={() => { playClick(); props.onAutoGenerateVillain(); }} className="text-[10px] font-bold bg-black text-white px-2 py-1 hover:bg-gray-800 border border-transparent">
                                        AUTO-GENERATE
                                     </button>
                                )}
                            </div>
                            {props.villain ? (
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <img src={`data:image/jpeg;base64,${props.villain.base64}`} className="w-12 h-12 object-cover border border-black" alt="Villain"/>
                                        <button onClick={() => { playClick(); props.onAutoGenerateVillain(); }} className="text-[10px] underline text-gray-500 hover:text-black">Regenerate</button>
                                    </div>
                                    {props.villain.name && (
                                        <div className="bg-white p-1 border border-gray-300">
                                             <p className="font-comic text-xs font-bold">{props.villain.name}</p>
                                             <p className="font-sans text-[8px] leading-tight text-gray-600 line-clamp-2">{props.villain.backstory}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <label className="text-[10px] text-center text-gray-400 cursor-pointer hover:text-black block w-full border border-gray-200 bg-white py-1">
                                    OR UPLOAD IMAGE
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { playClick(); e.target.files?.[0] && props.onVillainUpload(e.target.files[0]); }} />
                                </label>
                            )}
                        </div>

                        {/* GENERATE BIOS BUTTON */}
                        <button onClick={() => { playClick(); props.onGenerateBios(); }} 
                                className="comic-btn bg-white text-black text-sm px-4 py-2 hover:bg-gray-100 flex items-center justify-center gap-2 mt-auto"
                                disabled={!props.hero}>
                            <span>✨</span> GENERATE NAMES & BACKSTORIES
                        </button>
                    </div>

                    {/* COL 3: SETTINGS */}
                    <div className="flex flex-col gap-3">
                        <div className="font-comic text-xl text-black border-b-4 border-black mb-1">3. THE WORLD</div>
                        
                        <div className="bg-yellow-50 p-3 border-4 border-black h-full flex flex-col gap-3">
                            <div>
                                <p className="font-comic text-sm mb-1 font-bold text-gray-800">GENRE</p>
                                <select value={props.selectedGenre} onChange={(e) => { playClick(); props.onGenreChange(e.target.value); }} className="w-full font-comic text-base p-1 border-2 border-black uppercase bg-white cursor-pointer shadow-sm">
                                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>

                            <div>
                                <p className="font-comic text-sm mb-1 font-bold text-gray-800">ART STYLE</p>
                                <select value={props.selectedArtStyle} onChange={(e) => { playClick(); props.onArtStyleChange(e.target.value); }} className="w-full font-comic text-base p-1 border-2 border-black uppercase bg-white cursor-pointer shadow-sm">
                                    {ART_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div>
                                <p className="font-comic text-sm mb-1 font-bold text-gray-800">LANGUAGE</p>
                                <select value={props.selectedLanguage} onChange={(e) => { playClick(); props.onLanguageChange(e.target.value); }} className="w-full font-comic text-base p-1 border-2 border-black uppercase bg-white cursor-pointer shadow-sm">
                                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                                </select>
                            </div>

                            {props.selectedGenre === 'Custom' && (
                                <textarea value={props.customPremise} onChange={(e) => props.onPremiseChange(e.target.value)} placeholder="Story Premise..." className="w-full p-1 border-2 border-black font-comic text-sm h-12 resize-none" />
                            )}
                            
                            <label className="flex items-center gap-2 font-comic text-sm cursor-pointer mt-auto hover:bg-yellow-200 p-1 rounded transition-colors" onClick={playClick}>
                                <input type="checkbox" checked={props.richMode} onChange={(e) => props.onRichModeChange(e.target.checked)} className="w-4 h-4 accent-black" />
                                <span>NOVEL MODE (Rich Text)</span>
                            </label>
                        </div>
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
