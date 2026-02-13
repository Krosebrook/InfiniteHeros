
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { InventoryItem } from './types';

interface InventoryProps {
    items: InventoryItem[];
}

export const Inventory: React.FC<InventoryProps> = ({ items }) => {
    if (items.length === 0) return null;

    return (
        <div className="fixed top-20 left-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {items.map((item, i) => (
                <div key={i} className="pointer-events-auto bg-white border-2 border-black p-1 shadow-[4px_4px_0px_rgba(0,0,0,0.5)] flex items-center gap-2 animate-in slide-in-from-left duration-300 w-fit max-w-[200px]" title={item.name}>
                    {item.iconUrl ? (
                        <img src={item.iconUrl} className="w-8 h-8 object-cover border border-black bg-gray-200" alt={item.name} />
                    ) : (
                        <div className="w-8 h-8 bg-gray-300 border border-black flex items-center justify-center text-xs">?</div>
                    )}
                    <span className="font-comic text-xs uppercase font-bold truncate pr-1">{item.name}</span>
                </div>
            ))}
        </div>
    );
};
