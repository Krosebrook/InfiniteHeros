import React, { useState } from 'react';
import { Persona, WorldState } from './types';
import { soundManager } from './SoundManager';
import { t } from './translations';

interface SidebarProps {
    hero: Persona | null;
    friend: Persona | null;
    villain: Persona | null;
    worldState: WorldState;
    lang: string;
    onTalkToCharacter: (persona: Persona, role: string) => void;
    onOpenSettings: () => void;
    onGenerateCover: () => void;
    onExportImages: () => void;
    onGenerateVideo: () => void;
    onSaveProgress: () => void;
    onOpenMap: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    hero, friend, villain, worldState, lang,
    onTalkToCharacter, onOpenSettings, onGenerateCover,
    onExportImages, onGenerateVideo, onSaveProgress, onOpenMap
}) => {
    const [activeTab, setActiveTab] = useState<'chars' | 'inv' | 'actions'>('chars');

    const [expandedChar, setExpandedChar] = useState<string | null>(null);

    const renderCharMini = (p: Persona | null, role: string) => {
        if (!p) return null;
        const isExpanded = expandedChar === role;
        return (
            <div className="flex flex-col border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-all">
                <div className="flex items-center gap-3 p-2 cursor-pointer" onClick={() => { soundManager.play('click'); setExpandedChar(isExpanded ? null : role); }}>
                    <img src={`data:image/jpeg;base64,${p.base64}`} alt={p.name} className="w-12 h-12 object-cover border-2 border-black" />
                    <div className="flex-1 min-w-0">
                        <p className="font-comic text-sm uppercase truncate">{p.name}</p>
                        <p className="text-[10px] font-sans text-gray-600 truncate">{role}</p>
                    </div>
                    <span className="text-xl">{isExpanded ? '🔽' : '▶️'}</span>
                </div>
                {isExpanded && (
                    <div className="p-3 border-t-2 border-black bg-gray-50 flex flex-col gap-2">
                        <p className="text-xs font-sans text-gray-800 leading-relaxed">{p.backstory}</p>
                        <button 
                            onClick={(e) => { e.stopPropagation(); soundManager.play('pop'); onTalkToCharacter(p, role); }}
                            className="bg-yellow-400 border-2 border-black px-3 py-1 font-comic text-sm hover:bg-yellow-300 shadow-[2px_2px_0px_rgba(0,0,0,1)] uppercase self-end"
                        >
                            {t(lang, "TALK")}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="hidden md:flex flex-col w-80 h-screen border-r-8 border-black bg-yellow-400 z-50 overflow-hidden shrink-0">
            <div className="p-4 bg-black text-white border-b-4 border-white">
                <h1 className="font-comic text-3xl uppercase tracking-wider text-center text-yellow-400 drop-shadow-[2px_2px_0_rgba(255,255,255,0.3)]">Dashboard</h1>
            </div>

            <div className="flex border-b-4 border-black bg-white">
                <button 
                    onClick={() => { soundManager.play('click'); setActiveTab('chars'); }}
                    className={`flex-1 py-2 font-comic text-sm uppercase border-r-4 border-black ${activeTab === 'chars' ? 'bg-yellow-400' : 'bg-gray-200 hover:bg-gray-100'}`}
                >
                    Cast
                </button>
                <button 
                    onClick={() => { soundManager.play('click'); setActiveTab('inv'); }}
                    className={`flex-1 py-2 font-comic text-sm uppercase border-r-4 border-black ${activeTab === 'inv' ? 'bg-orange-400' : 'bg-gray-200 hover:bg-gray-100'}`}
                >
                    Bag
                </button>
                <button 
                    onClick={() => { soundManager.play('click'); setActiveTab('actions'); }}
                    className={`flex-1 py-2 font-comic text-sm uppercase ${activeTab === 'actions' ? 'bg-blue-400 text-white' : 'bg-gray-200 hover:bg-gray-100'}`}
                >
                    Actions
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-yellow-50 relative">
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2.5px)', backgroundSize: '12px 12px' }}></div>
                
                <div className="relative z-10">
                    {activeTab === 'chars' && (
                        <div className="flex flex-col gap-3">
                            {renderCharMini(hero, t(lang, "THE_HERO"))}
                            {renderCharMini(friend, t(lang, "THE_SIDEKICK"))}
                            {renderCharMini(villain, t(lang, "THE_VILLAIN"))}
                            
                            {worldState.npcs && worldState.npcs.length > 0 && (
                                <>
                                    <h3 className="font-comic text-lg mt-2 border-b-2 border-black">NPCs</h3>
                                    {worldState.npcs.map((npc, i) => renderCharMini(npc, `NPC ${i+1}`))}
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'inv' && (
                        <div className="flex flex-col gap-4">
                            <div className="bg-white border-4 border-black p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                                <div className="flex justify-between text-xs font-comic font-bold text-black uppercase tracking-widest mb-1">
                                    <span>{t(lang, "HEALTH")}</span>
                                    <span>{worldState.health}%</span>
                                </div>
                                <div className="h-4 bg-gray-200 border-2 border-black overflow-hidden">
                                    <div 
                                        className={`h-full ${worldState.health < 30 ? 'bg-red-500' : 'bg-green-500'}`} 
                                        style={{ width: `${worldState.health}%` }}
                                    />
                                </div>
                            </div>

                            <div className="bg-white border-4 border-black p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                                <h3 className="font-comic text-lg border-b-2 border-black mb-2">Inventory</h3>
                                {worldState.inventory.length === 0 ? (
                                    <p className="text-sm font-sans text-gray-500 italic">Empty</p>
                                ) : (
                                    <ul className="list-disc pl-5 text-sm font-sans font-bold">
                                        {worldState.inventory.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                )}
                            </div>

                            <div className="bg-white border-4 border-black p-3 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                                <h3 className="font-comic text-lg border-b-2 border-black mb-2">Status Effects</h3>
                                {worldState.status.length === 0 ? (
                                    <p className="text-sm font-sans text-gray-500 italic">None</p>
                                ) : (
                                    <ul className="list-disc pl-5 text-sm font-sans font-bold text-red-600">
                                        {worldState.status.map((status, i) => <li key={i}>{status}</li>)}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'actions' && (
                        <div className="flex flex-col gap-3">
                            <button onClick={onOpenMap} className="bg-blue-400 border-4 border-black px-4 py-2 font-comic text-lg hover:bg-blue-300 shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase flex items-center gap-3 transition-all">
                                <span className="text-xl">🕸️</span> {t(lang, "MAP")}
                            </button>
                            <button onClick={onOpenSettings} className="bg-gray-200 border-4 border-black px-4 py-2 font-comic text-lg hover:bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center gap-3 transition-all">
                                <span className="text-xl">⚙️</span> SETTINGS
                            </button>
                            <button onClick={onGenerateCover} className="bg-purple-500 border-4 border-black px-4 py-2 font-comic text-lg hover:bg-purple-400 shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase flex items-center gap-3 text-white transition-all">
                                <span className="text-xl">🎨</span> {t(lang, "COVER")}
                            </button>
                            <button onClick={onExportImages} className="bg-green-400 border-4 border-black px-4 py-2 font-comic text-lg hover:bg-green-300 shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase flex items-center gap-3 transition-all">
                                <span className="text-xl">📤</span> {t(lang, "EXPORT")}
                            </button>
                            <button onClick={onGenerateVideo} className="bg-red-600 text-white border-4 border-black px-4 py-2 font-comic text-lg hover:bg-red-500 shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase flex items-center gap-3 transition-all">
                                <span className="text-xl">🎬</span> VIDEO
                            </button>
                            <button onClick={onSaveProgress} className="bg-blue-600 text-white border-4 border-black px-4 py-2 font-comic text-lg hover:bg-blue-500 shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase flex items-center gap-3 transition-all">
                                <span className="text-xl">💾</span> {t(lang, "SAVE")}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
