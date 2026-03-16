
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useMemo } from 'react';
import { ComicFace } from './types';
import { soundManager } from './SoundManager';
import { t } from './translations';

interface MultiverseMapProps {
    storyTree: Record<string, ComicFace>;
    currentPath: ComicFace[];
    onNodeClick: (nodeId: string) => void;
    onClose: () => void;
    lang: string;
}

interface TreeNode {
    id: string;
    x: number;
    y: number;
    data: ComicFace;
    children: TreeNode[];
}

export const MultiverseMap: React.FC<MultiverseMapProps> = ({ storyTree, currentPath, onNodeClick, onClose, lang }) => {
    
    // Layout Calculation
    const { nodes, edges, width, height } = useMemo(() => {
        const allNodes = Object.values(storyTree) as ComicFace[];
        const rootNode = allNodes.find(n => n.pageIndex === 0);
        if (!rootNode) return { nodes: [], edges: [], width: 100, height: 100 };

        const LEVELS_GAP = 120; // Vertical space between pages
        const SIBLING_GAP = 100; // Horizontal space between branches

        const processedNodes: TreeNode[] = [];
        const processedEdges: { x1: number, y1: number, x2: number, y2: number, label?: string }[] = [];
        
        // Build hierarchy for traversal
        const childrenMap: Record<string, ComicFace[]> = {};
        allNodes.forEach(n => {
            if (n.parentId) {
                if (!childrenMap[n.parentId]) childrenMap[n.parentId] = [];
                childrenMap[n.parentId].push(n);
            }
        });

        // Recursive layout
        const traverse = (node: ComicFace, x: number, y: number, availableWidth: number): number => {
            const children = childrenMap[node.id] || [];
            const myNode: TreeNode = { id: node.id, x, y, data: node, children: [] };
            processedNodes.push(myNode);

            if (children.length === 0) return x;

            // Distribute children
            const childWidth = availableWidth / children.length;
            let startX = x - (availableWidth / 2) + (childWidth / 2);
            
            // If simple path (1 child), keep straight
            if (children.length === 1) startX = x;

            children.forEach((child, i) => {
                const childX = children.length === 1 ? x : startX + (i * childWidth);
                const childY = y + LEVELS_GAP;
                
                processedEdges.push({
                    x1: x, y1: y,
                    x2: childX, y2: childY,
                    label: child.choiceLabel
                });

                traverse(child, childX, childY, Math.max(SIBLING_GAP, childWidth));
            });
            
            return x;
        };

        // Start layout from root at center
        // Estimate total width based on max breadth
        traverse(rootNode, 500, 50, 800);

        // Normalize coordinates to fit view
        const xs = processedNodes.map(n => n.x);
        const ys = processedNodes.map(n => n.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);

        const w = Math.max(1000, maxX - minX + 200);
        const h = Math.max(600, maxY + 200);
        
        // Shift nodes
        const xOffset = (w / 2) - ((minX + maxX) / 2);
        processedNodes.forEach(n => n.x += xOffset);
        processedEdges.forEach(e => { e.x1 += xOffset; e.x2 += xOffset; });

        return { nodes: processedNodes, edges: processedEdges, width: w, height: h };
    }, [storyTree]);

    const handleNodeClick = (id: string) => {
        soundManager.play('click');
        onNodeClick(id);
    };

    return (
        <div 
            className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="map-title"
        >
            {/* Header */}
            <header className="flex justify-between items-center p-4 md:p-6 border-b-[6px] border-yellow-400 bg-black relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 2px, transparent 2.5px)', backgroundSize: '12px 12px' }}></div>
                <div className="relative z-10">
                    <h2 id="map-title" className="font-comic text-3xl md:text-5xl text-yellow-400 tracking-widest uppercase leading-none drop-shadow-[4px_4px_0px_#EF4444]">{t(lang, "MULTIVERSE_MAP")}</h2>
                    <p className="text-white font-mono text-[10px] md:text-sm mt-2 uppercase tracking-widest bg-red-600 inline-block px-2 py-1 transform -skew-x-12">{t(lang, "SELECT_NODE")}</p>
                </div>
                <button 
                    onClick={onClose} 
                    className="bg-white text-black px-6 md:px-8 py-2 md:py-3 font-comic text-xl md:text-2xl hover:bg-gray-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all border-4 border-black shadow-[6px_6px_0px_#EF4444] relative z-10 uppercase"
                    aria-label="Close Multiverse Map"
                >
                    {t(lang, "CLOSE")}
                </button>
            </header>

            {/* Canvas */}
            <div className="flex-1 overflow-auto custom-scrollbar relative bg-[#1a1a1a] cursor-grab active:cursor-grabbing" role="application" aria-label="Interactive Multiverse Map. Drag to pan.">
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                     style={{backgroundImage: 'radial-gradient(#fff 2px, transparent 2.5px)', backgroundSize: '20px 20px'}} aria-hidden="true"></div>
                
                <div style={{ width: width, height: height, minWidth: '100%', minHeight: '100%' }} className="relative mx-auto my-10 md:my-20">
                    <svg width={width} height={height} className="absolute top-0 left-0 pointer-events-none" aria-hidden="true">
                        {edges.map((e, i) => (
                            <g key={i}>
                                <path 
                                    d={`M${e.x1},${e.y1} C${e.x1},${(e.y1+e.y2)/2} ${e.x2},${(e.y1+e.y2)/2} ${e.x2},${e.y2}`}
                                    stroke="#555" 
                                    strokeWidth="6" 
                                    fill="none" 
                                    strokeDasharray="10,10"
                                />
                                {e.label && (
                                    <g transform={`translate(${(e.x1+e.x2)/2}, ${(e.y1+e.y2)/2})`}>
                                        <rect x="-60" y="-15" width="120" height="30" rx="0" fill="#FFD700" stroke="#000" strokeWidth="3" transform="rotate(-2)" />
                                        <text x="0" y="5" textAnchor="middle" fill="#000" fontSize="12" fontFamily="'Comic Neue', cursive" fontWeight="bold" transform="rotate(-2)">
                                            {e.label.length > 15 ? e.label.substring(0, 13) + '..' : e.label}
                                        </text>
                                    </g>
                                )}
                            </g>
                        ))}
                    </svg>

                    {nodes.map(node => {
                        const isActive = currentPath.some(p => p.id === node.id);
                        const isLeaf = currentPath[currentPath.length - 1]?.id === node.id;
                        
                        return (
                            <button key={node.id}
                                 onClick={() => handleNodeClick(node.id)}
                                 className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-all hover:scale-110 group z-10 focus:outline-none focus:ring-4 focus:ring-yellow-400`}
                                 style={{ left: node.x, top: node.y }}
                                 aria-label={`Jump to Page ${node.data.pageIndex}${isActive ? ' (Current Path)' : ''}`}
                                 aria-current={isLeaf ? 'page' : undefined}
                            >
                                <div className={`w-16 h-16 md:w-24 md:h-24 border-[4px] md:border-[6px] overflow-hidden relative shadow-[8px_8px_0px_rgba(0,0,0,1)] transition-all ${isActive ? 'border-yellow-400 rotate-2' : 'border-gray-500 grayscale hover:grayscale-0 -rotate-2'}`}>
                                    {node.data.imageUrl ? (
                                        <img src={node.data.imageUrl} className="w-full h-full object-cover filter contrast-125 saturate-125" alt="" aria-hidden="true" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-900 flex items-center justify-center text-xl text-gray-700 font-comic font-bold">?</div>
                                    )}
                                    {isLeaf && (
                                        <div className="absolute inset-0 border-[6px] border-red-600 animate-pulse" aria-hidden="true" />
                                    )}
                                </div>
                                <div className={`mt-3 px-4 py-1 text-xs md:text-sm font-bold font-comic whitespace-nowrap border-[3px] shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-colors ${isActive ? 'bg-yellow-400 text-black border-black transform rotate-[-3deg]' : 'bg-white text-black border-black group-hover:bg-gray-200 transform rotate-[3deg]'}`}>
                                    {t(lang, "PAGE")} {node.data.pageIndex}
                                </div>
                                {isLeaf && (
                                    <div className="absolute -top-6 bg-red-600 text-white text-[10px] md:text-xs px-3 py-1 font-comic uppercase font-bold border-[3px] border-black animate-bounce shadow-[4px_4px_0px_rgba(0,0,0,1)] transform rotate-12" aria-hidden="true">
                                        YOU ARE HERE
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
            
            {/* Legend/Hint */}
            <div className="bg-yellow-400 p-3 md:p-4 border-t-[6px] border-black text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2.5px)', backgroundSize: '10px 10px' }}></div>
                <p className="font-comic text-sm md:text-lg text-black uppercase tracking-widest relative z-10 font-bold">
                    {t(lang, "MAP_NAV_HINT")}
                </p>
            </div>
        </div>
    );
};
