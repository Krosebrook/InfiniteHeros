
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { TTSSettings, Achievement } from './types';

interface TTSSettingsDialogProps {
    settings: TTSSettings;
    achievements: Achievement[];
    onSave: (settings: TTSSettings) => void;
    onClose: () => void;
}

const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

export const TTSSettingsDialog: React.FC<TTSSettingsDialogProps> = ({ settings, achievements, onSave, onClose }) => {
    const [localSettings, setLocalSettings] = React.useState<TTSSettings>(settings);
    const handleChange = (key: keyof TTSSettings, value: any) => { setLocalSettings(prev => ({ ...prev, [key]: value })); };
    const handleSave = () => { onSave(localSettings); onClose(); };

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 p-4">
             <div className="bg-white border-[6px] border-black p-6 max-w-md w-full shadow-[12px_12px_0px_white] animate-in fade-in zoom-in duration-300 relative">
                <h2 className="font-comic text-3xl mb-4 border-b-4 border-black pb-2 text-black">SYSTEM CONFIG</h2>
                
                <div className="mb-6">
                    <label className="flex items-center gap-3 font-comic text-xl cursor-pointer p-2 border-2 border-transparent hover:border-black transition-all">
                        <input type="checkbox" checked={localSettings.autoPlay} onChange={e => handleChange('autoPlay', e.target.checked)} className="w-6 h-6 accent-yellow-400"/>
                        <span>AUTO-READ NEW PAGES</span>
                    </label>
                </div>

                <div className="mb-6">
                    <label className="block font-bold mb-2 font-comic text-xl">VOICE SPEED: {localSettings.playbackSpeed}x</label>
                    <input type="range" min="0.5" max="2" step="0.1" value={localSettings.playbackSpeed} onChange={e => handleChange('playbackSpeed', parseFloat(e.target.value))} className="w-full accent-black h-4 bg-gray-200 border-2 border-black" />
                </div>

                <div className="mb-8">
                     <label className="block font-bold mb-2 font-comic text-xl">ACHIEVEMENTS</label>
                     <div className="grid grid-cols-2 gap-2">
                        {achievements.map(a => (
                            <div key={a.id} className={`p-2 border-2 border-black flex flex-col gap-1 ${a.unlocked ? 'bg-yellow-200 opacity-100' : 'bg-gray-100 opacity-40'}`}>
                                <span className="font-comic text-xs uppercase">{a.unlocked ? '🏆' : '🔒'} {a.title}</span>
                                <p className="text-[8px] font-sans leading-tight">{a.description}</p>
                            </div>
                        ))}
                     </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 py-3 border-4 border-black font-bold font-comic text-xl uppercase">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-3 border-4 border-black bg-green-400 font-bold font-comic text-xl uppercase shadow-[4px_4px_0px_black]">Save</button>
                </div>
             </div>
        </div>
    );
};
