
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
}

export const CharacterBios: React.FC<CharacterBiosProps> = ({ hero, friend, villain, onClose }) => {
    const handleClose = () => {
        soundManager.play('click');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={handleClose}>
            <div className="bg-white max-w-4xl w-full p-2 border-[6px] border-black shadow-[16px_16px_0px_rgba(255,255,255,0.2)] rotate-1 relative" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="bg-yellow-400 border-b-4 border-black p-4 flex justify-between items-center mb-6">
                    <h2 className="font-comic text-4xl text-black uppercase tracking-wider">Dramatis Personae</h2>
                    <button onClick={handleClose} className="font-comic text-2xl hover:text-red-600">✕ CLOSE</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
                    {/* Hero Card */}
                    {hero && (
                        <div className="flex flex-col gap-2 group">
                            <div className="relative border-4 border-black bg-blue-50 rotate-[-2deg] group-hover:rotate-0 transition-transform duration-300">
                                <div className="absolute -top-3 -left-3 bg-blue-600 text-white font-comic px-2 py-1 border-2 border-black z-10 text-sm">THE HERO</div>
                                <img src={`data:image/jpeg;base64,${hero.base64}`} alt="Hero" className="w-full h-48 object-cover border-b-4 border-black" />
                                <div className="p-4">
                                    <h3 className="font-comic text-2xl text-black mb-1 leading-none">{hero.name || "Unknown Hero"}</h3>
                                    <p className="font-sans text-xs text-gray-600 leading-tight border-t-2 border-dashed border-gray-400 pt-2">
                                        {hero.backstory || "Origin story classified."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Friend Card */}
                    {friend && (
                        <div className="flex flex-col gap-2 group mt-8 md:mt-0">
                             <div className="relative border-4 border-black bg-purple-50 rotate-[1deg] group-hover:rotate-0 transition-transform duration-300">
                                <div className="absolute -top-3 -right-3 bg-purple-600 text-white font-comic px-2 py-1 border-2 border-black z-10 text-sm">THE ALLY</div>
                                <img src={`data:image/jpeg;base64,${friend.base64}`} alt="Friend" className="w-full h-48 object-cover border-b-4 border-black" />
                                <div className="p-4">
                                    <h3 className="font-comic text-2xl text-black mb-1 leading-none">{friend.name || "Trusty Sidekick"}</h3>
                                    <p className="font-sans text-xs text-gray-600 leading-tight border-t-2 border-dashed border-gray-400 pt-2">
                                        {friend.backstory || "Loyal to the end."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Villain Card */}
                    {villain && (
                        <div className="flex flex-col gap-2 group mt-4 md:mt-12">
                             <div className="relative border-4 border-black bg-red-50 rotate-[3deg] group-hover:rotate-0 transition-transform duration-300">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white font-comic px-2 py-1 border-2 border-black z-10 text-sm">THE THREAT</div>
                                <img src={`data:image/jpeg;base64,${villain.base64}`} alt="Villain" className="w-full h-48 object-cover border-b-4 border-black grayscale-[50%] group-hover:grayscale-0 transition-all" />
                                <div className="p-4">
                                    <h3 className="font-comic text-2xl text-black mb-1 leading-none">{villain.name || "Dark Nemesis"}</h3>
                                    <p className="font-sans text-xs text-gray-600 leading-tight border-t-2 border-dashed border-gray-400 pt-2">
                                        {villain.backstory || "Motives unclear."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-4 text-center">
                    <p className="font-comic text-gray-400 text-sm">CONFIDENTIAL FILES • EYES ONLY</p>
                </div>
            </div>
        </div>
    );
};
