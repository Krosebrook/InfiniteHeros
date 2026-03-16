
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Persona } from './types';
import { soundManager } from './SoundManager';
import { t } from './translations';

interface CharacterBiosProps {
    hero: Persona | null;
    friend: Persona | null;
    villain: Persona | null;
    npcs?: Persona[];
    onClose: () => void;
    onTalkToCharacter: (persona: Persona, role: string) => void;
    lang: string;
}

export const CharacterBios: React.FC<CharacterBiosProps> = ({ hero, friend, villain, npcs = [], onClose, onTalkToCharacter, lang }) => {
    const handleClose = () => { soundManager.play('click'); onClose(); };
    const handleTalk = (p: Persona, role: string) => { soundManager.play('pop'); onTalkToCharacter(p, role); };

    const renderCard = (p: Persona, role: string, colorClass: string, rotateClass: string) => (
        <article className={`flex flex-col h-full border-[6px] border-black bg-white shadow-[12px_12px_0px_rgba(0,0,0,1)] ${rotateClass} transition-transform hover:scale-[1.02] hover:z-10 relative`} aria-labelledby={`char-${p.name?.replace(/\s+/g, '-')}`}>
            <div className={`${colorClass} p-3 border-b-[6px] border-black flex justify-between items-center relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2.5px)', backgroundSize: '10px 10px' }}></div>
                <span className="font-comic text-2xl text-black uppercase tracking-widest relative z-10">{role}</span>
                <span className="text-xs font-mono bg-black text-white px-2 py-1 transform rotate-3 relative z-10 shadow-[2px_2px_0px_#EF4444]" aria-label="Security Clearance: Confidential">{t(lang, "CONFIDENTIAL")}</span>
            </div>
            <div className="h-64 overflow-hidden border-b-[6px] border-black bg-gray-200 relative group">
                <img src={`data:image/jpeg;base64,${p.base64}`} alt={`Portrait of ${p.name || role}`} className="w-full h-full object-cover object-top filter contrast-110 saturate-110" />
                <button 
                    onClick={() => handleTalk(p, role)}
                    className="absolute bottom-4 right-4 bg-yellow-400 border-4 border-black px-6 py-2 font-comic text-xl hover:bg-yellow-300 shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all"
                    aria-label={`Talk to ${p.name || role}`}
                    title={`Initiate conversation with ${p.name || role}`}
                >{t(lang, "TALK")}</button>
            </div>
            <div className="p-5 flex-1 flex flex-col bg-yellow-50 relative">
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2.5px)', backgroundSize: '12px 12px' }}></div>
                <h3 id={`char-${p.name?.replace(/\s+/g, '-')}`} className="font-comic text-4xl text-black mb-3 leading-none relative z-10 uppercase">{p.name || t(lang, "UNKNOWN")}</h3>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                     <p className="font-sans text-base text-gray-900 leading-relaxed font-bold">{p.backstory || t(lang, "NO_DATA_AVAILABLE")}</p>
                </div>
            </div>
        </article>
    );

    return (
        <div 
            className="fixed inset-0 z-[500] flex items-center justify-center p-2 md:p-10 bg-black/90 backdrop-blur-md animate-in fade-in duration-200" 
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bios-title"
        >
            <div className="w-full max-w-6xl h-full max-h-[95vh] md:max-h-[90vh] flex flex-col pointer-events-auto" onClick={e => e.stopPropagation()}>
                <div className="relative bg-[#f0f0f0] border-[4px] md:border-[8px] border-black shadow-[10px_10px_0px_#222] md:shadow-[20px_20px_0px_#222] flex flex-col h-full overflow-hidden">
                    <header className="bg-black text-white p-3 md:p-4 flex justify-between items-center border-b-[4px] md:border-b-[6px] border-yellow-400">
                        <div>
                             <h1 id="bios-title" className="font-comic text-3xl md:text-5xl text-yellow-400 leading-none tracking-widest uppercase">{t(lang, "PERSONNEL_ARCHIVES")}</h1>
                             <p className="font-mono text-[10px] md:text-xs text-gray-400 tracking-[0.2em] md:tracking-[0.3em]">{t(lang, "MULTIVERSE_REGISTRY")}</p>
                        </div>
                        <button 
                            onClick={handleClose} 
                            className="bg-red-600 hover:bg-red-500 text-white font-comic text-lg md:text-xl px-4 md:px-6 py-1 md:py-2 border-2 border-white uppercase active:scale-95 transition-transform"
                            aria-label="Close Personnel Archives"
                        >{t(lang, "CLOSE")}</button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[radial-gradient(#ccc_1px,transparent_1px)] [background-size:20px_20px]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-start">
                            {hero && renderCard(hero, t(lang, "HERO"), "bg-blue-300", "rotate-[-1deg]")}
                            {friend && renderCard(friend, t(lang, "ALLY"), "bg-purple-300", "rotate-[1deg]")}
                            {villain && renderCard(villain, t(lang, "THREAT"), "bg-red-400", "rotate-[-1deg]")}
                            
                            {npcs.map((npc, idx) => (
                                <div key={idx} className="mt-0">
                                    {renderCard(npc, t(lang, "CITIZEN"), "bg-gray-300", idx % 2 === 0 ? "rotate-[1deg]" : "rotate-[-1deg]")}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
