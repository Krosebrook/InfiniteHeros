
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
    onClose: () => void;
    onTalkToCharacter: (persona: Persona, role: string) => void;
}

export const CharacterBios: React.FC<CharacterBiosProps> = ({ hero, friend, villain, onClose, onTalkToCharacter }) => {
    const handleClose = () => {
        soundManager.play('click');
        onClose();
    };

    const handleTalk = (p: Persona, role: string) => {
        soundManager.play('pop');
        onTalkToCharacter(p, role);
    };

    // Helper to render a card
    const renderCard = (p: Persona, role: string, colorClass: string, rotateClass: string) => (
        <div className={`flex flex-col h-full border-4 border-black bg-white shadow-[8px_8px_0px_rgba(0,0,0,0.2)] ${rotateClass} transition-transform hover:scale-[1.02] hover:z-10`}>
            {/* Header */}
            <div className={`${colorClass} p-2 border-b-4 border-black flex justify-between items-center`}>
                <span className="font-comic text-xl text-black uppercase tracking-wider">{role}</span>
                <span className="text-xs font-mono bg-black text-white px-1">CONFIDENTIAL</span>
            </div>
            
            {/* Image */}
            <div className="h-64 overflow-hidden border-b-4 border-black bg-gray-200 relative group">
                <img src={`data:image/jpeg;base64,${p.base64}`} alt={role} className="w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                <button 
                    onClick={() => handleTalk(p, role)}
                    className="absolute bottom-4 right-4 bg-yellow-400 border-2 border-black px-4 py-2 font-comic text-lg hover:scale-110 shadow-lg active:scale-90 transition-transform"
                >
                    💬 TALK
                </button>
            </div>

            {/* Info */}
            <div className="p-4 flex-1 flex flex-col bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]">
                <h3 className="font-comic text-3xl text-black mb-2 leading-none">{p.name || "Unknown"}</h3>
                
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                     <p className="font-sans text-sm text-gray-800 leading-relaxed font-medium">
                        {p.backstory || "No data available in the archives."}
                     </p>
                </div>

                {/* Decorative Footer */}
                <div className="mt-4 pt-2 border-t-2 border-black border-dashed flex justify-between items-center opacity-60">
                    <span className="font-mono text-[10px] uppercase">ID: {Math.random().toString(36).substr(2, 8).toUpperCase()}</span>
                    <span className="font-comic text-xs">STATUS: ACTIVE</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-10 bg-black/90 backdrop-blur-md animate-in fade-in duration-200" onClick={handleClose}>
            <div className="w-full max-w-6xl h-full max-h-[90vh] flex flex-col pointer-events-auto" onClick={e => e.stopPropagation()}>
                
                {/* Main Container */}
                <div className="relative bg-[#f0f0f0] border-[8px] border-black shadow-[20px_20px_0px_#222] flex flex-col h-full overflow-hidden">
                    
                    {/* Top Bar */}
                    <div className="bg-black text-white p-4 flex justify-between items-center border-b-[6px] border-yellow-400">
                        <div>
                             <h1 className="font-comic text-4xl md:text-5xl text-yellow-400 leading-none tracking-widest">TOP SECRET // CAST</h1>
                             <p className="font-mono text-xs text-gray-400 tracking-[0.3em]">MULTIVERSE REGISTRY DATABASE</p>
                        </div>
                        <button onClick={handleClose} className="bg-red-600 hover:bg-red-500 text-white font-comic text-xl px-6 py-2 border-2 border-white uppercase tracking-wider">
                            Close Dossier
                        </button>
                    </div>

                    {/* Content Grid */}
                    <div className="flex-1 overflow-y-auto p-8 bg-[radial-gradient(#ccc_1px,transparent_1px)] [background-size:20px_20px]">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                            {hero ? renderCard(hero, "THE HERO", "bg-blue-300", "rotate-[-1deg]") : <div className="p-8 border-4 border-dashed border-gray-400 text-center font-comic text-2xl text-gray-400">HERO DATA CORRUPTED</div>}
                            
                            {friend && renderCard(friend, "THE ALLY", "bg-purple-300", "rotate-[1deg] mt-8 md:mt-0")}
                            
                            {villain && renderCard(villain, "THE THREAT", "bg-red-400", "rotate-[-1deg] mt-8 md:mt-12")}
                        </div>
                    </div>
                    
                    {/* Stamped Effect */}
                    <div className="absolute bottom-8 right-8 pointer-events-none opacity-80 mix-blend-multiply">
                         <div className="border-8 border-red-700 p-4 rounded-xl rotate-[-15deg] mask-image">
                             <span className="font-black font-sans text-6xl text-red-700 uppercase tracking-tighter block">CLASSIFIED</span>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
