
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
            className="fixed top-20 md:top-24 left-2 md:left-4 z-[90] flex flex-col gap-4 md:gap-6 font-sans max-w-[160px] md:max-w-[220px] pointer-events-none" 
            aria-label="World State"
        >
            {/* Status Effects */}
            {status.length > 0 && (
                <section aria-labelledby="status-heading" className="pointer-events-auto flex flex-col items-start gap-2">
                    <h3 id="status-heading" className="font-comic text-yellow-400 text-xl md:text-2xl tracking-widest drop-shadow-[4px_4px_0_#EF4444] uppercase bg-black px-3 py-1 rotate-[-3deg] border-2 border-white shadow-[4px_4px_0_rgba(0,0,0,1)]">
                        {t(lang, "STATUS")}
                    </h3>
                    <div className="flex flex-col gap-3 w-full mt-2">
                        {status.map((s, i) => (
                            <div 
                                key={i} 
                                className="bg-red-600 text-white border-4 border-black p-2 md:p-3 shadow-[6px_6px_0_rgba(0,0,0,1)] flex items-center gap-2 md:gap-3 animate-in slide-in-from-left duration-300 skew-x-[-6deg] hover:scale-105 transition-transform relative overflow-hidden"
                                role="status"
                            >
                                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2.5px)', backgroundSize: '10px 10px' }}></div>
                                <span className="text-2xl md:text-3xl filter drop-shadow-[2px_2px_0_black] relative z-10" aria-hidden="true">⚡</span>
                                <span className="font-comic text-xs md:text-base uppercase font-bold skew-x-[6deg] tracking-wider relative z-10">{s}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Inventory Items */}
            {items.length > 0 && (
                <section aria-labelledby="inventory-heading" className="pointer-events-auto flex flex-col items-start gap-2 mt-4">
                    <h3 id="inventory-heading" className="font-comic text-yellow-400 text-xl md:text-2xl tracking-widest drop-shadow-[4px_4px_0_#3B82F6] uppercase bg-black px-3 py-1 rotate-[-3deg] border-2 border-white shadow-[4px_4px_0_rgba(0,0,0,1)]">
                        {t(lang, "INVENTORY")}
                    </h3>
                    <div className="flex flex-col gap-3 w-full mt-2" role="list">
                        {items.map((item, i) => (
                            <div 
                                key={i} 
                                className="bg-white border-4 border-black p-1.5 md:p-2 shadow-[6px_6px_0_rgba(0,0,0,1)] flex items-center gap-3 animate-in slide-in-from-left duration-300 group relative w-fit max-w-[140px] md:max-w-[200px] hover:bg-yellow-50 transition-colors cursor-help transform hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[8px_8px_0_rgba(0,0,0,1)]" 
                                title={item.description || item.name} 
                                tabIndex={0} 
                                role="listitem"
                                aria-label={`${item.name}: ${item.description || "A useful item."}`}
                            >
                                <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] bg-gray-200 overflow-hidden">
                                    {item.iconUrl ? (
                                        <img src={item.iconUrl} className="w-full h-full object-cover filter contrast-125 saturate-125" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xl font-comic font-bold text-gray-500">?</div>
                                    )}
                                </div>
                                
                                <span className="font-comic text-xs md:text-sm uppercase font-bold truncate pr-1 select-none">{item.name}</span>
                                
                                {/* Tooltip - Hidden on touch devices, shown on hover */}
                                <div className="absolute left-full top-0 ml-4 bg-yellow-100 text-black text-xs md:text-sm p-3 w-40 md:w-48 border-4 border-black opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] shadow-[6px_6px_0_rgba(0,0,0,1)] hidden md:block">
                                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2.5px)', backgroundSize: '10px 10px' }}></div>
                                    <p className="font-comic font-bold mb-1 text-red-600 uppercase text-lg leading-none relative z-10">{item.name}</p>
                                    <p className="font-sans font-bold leading-tight relative z-10">{item.description || "A useful item."}</p>
                                    {/* Arrow */}
                                    <div className="absolute top-4 -left-2.5 w-4 h-4 bg-yellow-100 border-l-4 border-b-4 border-black transform rotate-45"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </aside>
    );
};
