
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Persona } from './types';
import { soundManager } from './SoundManager';

interface CharacterBiosProps {
    hero: Persona | null;
    friend: Persona | null;
    villain: Persona | null;
    npcs?: Persona[];
    onClose: () => void;
    onTalkToCharacter: (persona: Persona, role: string) => void;
}

export const CharacterBios: React.FC<CharacterBiosProps> = ({ hero, friend, villain, npcs = [], onClose, onTalkToCharacter }) => {
    const handleClose = () => { soundManager.play('click'); onClose(); };
    const handleTalk = (p: Persona, role: string) => { soundManager.play('pop'); onTalkToCharacter(p, role); };

    const renderCard = (p: Persona, role: string, colorClass: string, rotateClass: string) => (
        <div className={`flex flex-col h-full border-4 border-black bg-white shadow-[8px_8px_0px_rgba(0,0,0,0.2)] ${rotateClass} transition-transform hover:scale-[1.02] hover:z-10`}>
            <div className={`${colorClass} p-2 border-b-4 border-black flex justify-between items-center`}>
                <span className="font-comic text-xl text-black uppercase tracking-wider">{role}</span>
                <span className="text-xs font-mono bg-black text-white px-1">CONFIDENTIAL</span>
            </div>
            <div className="h-64 overflow-hidden border-b-4 border-black bg-gray-200 relative group">
                <img src={`data:image/jpeg;base64,${p.base64}`} alt={role} className="w-full h-full object-cover object-top" />
                <button 
                    onClick={() => handleTalk(p, role)}
                    className="absolute bottom-4 right-4 bg-yellow-400 border-2 border-black px-4 py-2 font-comic text-lg hover:scale-110 shadow-lg"
                >💬 TALK</button>
            </div>
            <div className="p-4 flex-1 flex flex-col bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]">
                <h3 className="font-comic text-3xl text-black mb-2 leading-none">{p.name || "Unknown"}</h3>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                     <p className="font-sans text-sm text-gray-800 leading-relaxed font-medium">{p.backstory || "No data available."}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-10 bg-black/90 backdrop-blur-md animate-in fade-in duration-200" onClick={handleClose}>
            <div className="w-full max-w-6xl h-full max-h-[90vh] flex flex-col pointer-events-auto" onClick={e => e.stopPropagation()}>
                <div className="relative bg-[#f0f0f0] border-[8px] border-black shadow-[20px_20px_0px_#222] flex flex-col h-full overflow-hidden">
                    <div className="bg-black text-white p-4 flex justify-between items-center border-b-[6px] border-yellow-400">
                        <div>
                             <h1 className="font-comic text-4xl md:text-5xl text-yellow-400 leading-none tracking-widest">PERSONNEL ARCHIVES</h1>
                             <p className="font-mono text-xs text-gray-400 tracking-[0.3em]">MULTIVERSE REGISTRY // CODEX</p>
                        </div>
                        <button onClick={handleClose} className="bg-red-600 hover:bg-red-500 text-white font-comic text-xl px-6 py-2 border-2 border-white uppercase">Close</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 bg-[radial-gradient(#ccc_1px,transparent_1px)] [background-size:20px_20px]">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                            {hero && renderCard(hero, "HERO", "bg-blue-300", "rotate-[-1deg]")}
                            {friend && renderCard(friend, "ALLY", "bg-purple-300", "rotate-[1deg]")}
                            {villain && renderCard(villain, "THREAT", "bg-red-400", "rotate-[-1deg]")}
                            
                            {npcs.map((npc, idx) => (
                                <div key={idx} className="mt-4">
                                    {renderCard(npc, "CITIZEN", "bg-gray-300", idx % 2 === 0 ? "rotate-[1deg]" : "rotate-[-1deg]")}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
