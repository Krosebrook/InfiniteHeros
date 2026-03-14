
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { InventoryItem } from './types';
import { t } from './translations';

interface InventoryProps {
    items: InventoryItem[];
    status: string[];
    lang: string;
}

export const Inventory: React.FC<InventoryProps> = ({ items, status, lang }) => {
    const hasContent = items.length > 0 || status.length > 0;
    
    if (!hasContent) return null;

    return (
        <aside 
            className="fixed top-24 left-4 z-[90] flex flex-col gap-6 font-sans max-w-[220px] pointer-events-none" 
            aria-label="World State"
        >
            {/* Status Effects */}
            {status.length > 0 && (
                <section aria-labelledby="status-heading" className="pointer-events-auto flex flex-col items-start gap-2">
                    <h3 id="status-heading" className="font-comic text-yellow-400 text-xl tracking-widest drop-shadow-[2px_2px_0px_black] uppercase bg-black/50 px-2 rotate-[-2deg]">
                        {t(lang, "STATUS")}
                    </h3>
                    <div className="flex flex-col gap-2 w-full">
                        {status.map((s, i) => (
                            <div 
                                key={i} 
                                className="bg-red-600 text-white border-2 border-black p-2 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-in slide-in-from-left duration-300 skew-x-[-6deg] hover:scale-105 transition-transform"
                                role="status"
                            >
                                <span className="text-2xl filter drop-shadow-[1px_1px_0px_black]" aria-hidden="true">⚡</span>
                                <span className="font-comic text-sm uppercase font-bold skew-x-[6deg] tracking-wide">{s}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Inventory Items */}
            {items.length > 0 && (
                <section aria-labelledby="inventory-heading" className="pointer-events-auto flex flex-col items-start gap-2">
                    <h3 id="inventory-heading" className="font-comic text-yellow-400 text-xl tracking-widest drop-shadow-[2px_2px_0px_black] uppercase bg-black/50 px-2 rotate-[-2deg]">
                        {t(lang, "INVENTORY")}
                    </h3>
                    <div className="flex flex-col gap-2 w-full" role="list">
                        {items.map((item, i) => (
                            <div 
                                key={i} 
                                className="bg-white border-2 border-black p-1.5 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] flex items-center gap-2 animate-in slide-in-from-left duration-300 group relative w-fit max-w-[200px] hover:bg-yellow-50 transition-colors cursor-help" 
                                title={item.description || item.name} 
                                tabIndex={0} 
                                role="listitem"
                            >
                                <div className="relative w-10 h-10 flex-shrink-0">
                                    {item.iconUrl ? (
                                        <img src={item.iconUrl} className="w-full h-full object-cover border border-black bg-gray-200" alt="" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-300 border border-black flex items-center justify-center text-xs animate-pulse font-bold text-gray-500">?</div>
                                    )}
                                </div>
                                
                                <span className="font-comic text-xs uppercase font-bold truncate pr-1 select-none">{item.name}</span>
                                
                                {/* Tooltip */}
                                <div className="absolute left-full top-0 ml-3 bg-black text-white text-xs p-2 w-40 border-2 border-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-xl rounded-sm">
                                    <p className="font-bold mb-1 text-yellow-400 uppercase">{item.name}</p>
                                    <p className="font-sans leading-tight">{item.description || "A useful item."}</p>
                                    {/* Arrow */}
                                    <div className="absolute top-3 -left-1.5 w-3 h-3 bg-black border-l-2 border-b-2 border-yellow-400 transform rotate-45"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </aside>
    );
};
