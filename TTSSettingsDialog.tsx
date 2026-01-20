
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { TTSSettings } from './types';

interface TTSSettingsDialogProps {
    settings: TTSSettings;
    onSave: (settings: TTSSettings) => void;
    onClose: () => void;
}

const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

export const TTSSettingsDialog: React.FC<TTSSettingsDialogProps> = ({ settings, onSave, onClose }) => {
    const [localSettings, setLocalSettings] = React.useState<TTSSettings>(settings);

    const handleChange = (key: keyof TTSSettings, value: any) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 p-4">
             <div className="bg-white border-[6px] border-black p-6 max-w-sm w-full shadow-[12px_12px_0px_white] animate-in fade-in zoom-in duration-300 relative">
                <h2 className="font-comic text-3xl mb-4 border-b-4 border-black pb-2 text-black">AUDIO SETTINGS</h2>
                
                {/* Auto Play */}
                <div className="mb-6">
                    <label className="flex items-center gap-3 font-comic text-xl cursor-pointer hover:bg-gray-100 p-2 border-2 border-transparent hover:border-black transition-all">
                        <input 
                            type="checkbox" 
                            checked={localSettings.autoPlay} 
                            onChange={e => handleChange('autoPlay', e.target.checked)} 
                            className="w-6 h-6 accent-yellow-400"
                        />
                        <span>AUTO-READ NEW PAGES</span>
                    </label>
                    <p className="text-gray-500 text-xs ml-11 font-mono">Narrates story automatically when generated.</p>
                </div>

                {/* Playback Speed */}
                <div className="mb-6">
                    <label className="block font-bold mb-2 font-comic text-xl">SPEED: {localSettings.playbackSpeed}x</label>
                    <input 
                        type="range" 
                        min="0.5" 
                        max="2" 
                        step="0.1" 
                        value={localSettings.playbackSpeed} 
                        onChange={e => handleChange('playbackSpeed', parseFloat(e.target.value))} 
                        className="w-full accent-black h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer border-2 border-black" 
                    />
                    <div className="flex justify-between text-xs font-mono text-gray-400 mt-1">
                        <span>SLOW</span>
                        <span>FAST</span>
                    </div>
                </div>

                {/* Default Voice */}
                <div className="mb-8">
                     <label className="block font-bold mb-2 font-comic text-xl">NARRATOR VOICE</label>
                     <div className="grid grid-cols-2 gap-2">
                        {VOICES.map(v => (
                            <button 
                                key={v}
                                onClick={() => handleChange('defaultVoice', v)}
                                className={`py-2 px-1 border-2 border-black font-bold font-comic text-sm transition-colors uppercase ${localSettings.defaultVoice === v ? 'bg-yellow-400 shadow-[2px_2px_0px_black] translate-x-[-1px] translate-y-[-1px]' : 'bg-white hover:bg-gray-100'}`}
                            >
                                {v}
                            </button>
                        ))}
                     </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 py-3 border-4 border-black font-bold hover:bg-gray-200 font-comic text-xl uppercase">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-3 border-4 border-black bg-green-400 font-bold hover:bg-green-300 font-comic text-xl uppercase shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                        Save
                    </button>
                </div>
             </div>
        </div>
    );
};
