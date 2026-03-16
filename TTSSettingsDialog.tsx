
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { TTSSettings, Achievement } from './types';
import { t } from './translations';

interface TTSSettingsDialogProps {
    settings: TTSSettings;
    achievements: Achievement[];
    onSave: (settings: TTSSettings) => void;
    onClose: () => void;
    lang: string;
}

const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

export const TTSSettingsDialog: React.FC<TTSSettingsDialogProps> = ({ settings, achievements, onSave, onClose, lang }) => {
    const [localSettings, setLocalSettings] = React.useState<TTSSettings>(settings);
    const handleChange = (key: keyof TTSSettings, value: any) => { setLocalSettings(prev => ({ ...prev, [key]: value })); };
    const handleSave = () => { onSave(localSettings); onClose(); };

    return (
        <div 
            className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 p-2 md:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
        >
             <div className="bg-white border-[6px] md:border-[8px] border-black p-6 md:p-8 max-w-lg w-full shadow-[12px_12px_0px_rgba(255,255,255,1)] md:shadow-[20px_20px_0px_rgba(255,255,255,1)] animate-in fade-in zoom-in duration-300 relative overflow-y-auto max-h-[95vh] transform -rotate-1">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2.5px)', backgroundSize: '10px 10px' }}></div>
                
                <h2 id="settings-title" className="font-comic text-4xl md:text-5xl mb-6 border-b-[6px] border-black pb-4 text-black uppercase tracking-tighter text-center bg-blue-400 p-2 transform skew-x-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] relative z-10">{t(lang, "SYSTEM_CONFIG")}</h2>
                
                <div className="mb-8 relative z-10">
                    <label className="flex items-center gap-4 font-comic text-xl md:text-2xl cursor-pointer p-4 border-4 border-black bg-yellow-100 hover:bg-yellow-200 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] transform rotate-1">
                        <input 
                            type="checkbox" 
                            checked={localSettings.autoPlay} 
                            onChange={e => handleChange('autoPlay', e.target.checked)} 
                            className="w-8 h-8 accent-black border-4 border-black cursor-pointer"
                            aria-label={t(lang, "AUTO_READ")}
                        />
                        <span className="uppercase tracking-tight">{t(lang, "AUTO_READ")}</span>
                    </label>
                </div>

                <div className="mb-8 relative z-10 p-4 border-4 border-black bg-gray-100 shadow-[4px_4px_0px_rgba(0,0,0,1)] transform -rotate-1">
                    <label htmlFor="playback-speed" className="block font-bold mb-4 font-comic text-2xl uppercase tracking-tight bg-black text-white inline-block px-3 py-1 transform -rotate-2 shadow-[4px_4px_0px_rgba(255,255,255,1)]">{t(lang, "VOICE_SPEED")}: {localSettings.playbackSpeed}x</label>
                    <input 
                        id="playback-speed"
                        type="range" 
                        min="0.5" 
                        max="2" 
                        step="0.1" 
                        value={localSettings.playbackSpeed} 
                        onChange={e => handleChange('playbackSpeed', parseFloat(e.target.value))} 
                        className="w-full accent-black h-6 bg-white border-4 border-black cursor-pointer appearance-none shadow-[inset_2px_2px_0px_rgba(0,0,0,0.2)]" 
                    />
                </div>

                <div className="mb-8 relative z-10">
                     <label className="block font-bold mb-4 font-comic text-2xl uppercase tracking-tight bg-black text-white inline-block px-3 py-1 transform rotate-2 shadow-[4px_4px_0px_rgba(255,255,255,1)]">{t(lang, "ACHIEVEMENTS")}</label>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="list" aria-label="Achievements list">
                        {achievements.map(a => (
                            <div 
                                key={a.id} 
                                role="listitem"
                                className={`p-4 border-4 border-black flex flex-col gap-2 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] ${a.unlocked ? 'bg-yellow-300 opacity-100 transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)]' : 'bg-gray-200 opacity-60 grayscale'}`}
                                aria-label={`${a.title}: ${a.unlocked ? 'Unlocked' : 'Locked'}. ${a.description}`}
                            >
                                <span className="font-comic text-lg md:text-xl uppercase flex items-center gap-2 font-bold tracking-tight leading-none">
                                    <span aria-hidden="true" className="text-2xl">{a.unlocked ? '🏆' : '🔒'}</span> 
                                    {a.title}
                                </span>
                                <p className="text-xs md:text-sm font-sans font-bold leading-snug text-black bg-white/50 p-2 border-2 border-black/20 rounded">{a.description}</p>
                            </div>
                        ))}
                     </div>
                </div>

                <div className="flex gap-4 mt-8 relative z-10">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-3 md:py-4 border-4 border-black font-bold font-comic text-xl md:text-2xl uppercase hover:bg-gray-200 active:scale-95 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] bg-white"
                    >{t(lang, "CANCEL")}</button>
                    <button 
                        onClick={handleSave} 
                        className="flex-1 py-3 md:py-4 border-4 border-black bg-green-400 font-bold font-comic text-xl md:text-2xl uppercase shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-green-300 active:scale-95 transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] transform rotate-1"
                    >{t(lang, "SAVE_SETTINGS")}</button>
                </div>
             </div>
        </div>
    );
};
