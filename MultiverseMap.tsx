
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useMemo } from 'react';
import { ComicFace } from './types';
import { soundManager } from './SoundManager';

interface MultiverseMapProps {
    storyTree: Record<string, ComicFace>;
    currentPath: ComicFace[];
    onNodeClick: (nodeId: string) => void;
    onClose: () => void;
}

interface TreeNode {
    id: string;
    x: number;
    y: number;
    data: ComicFace;
    children: TreeNode[];
}

export const MultiverseMap: React.FC<MultiverseMapProps> = ({ storyTree, currentPath, onNodeClick, onClose }) => {
    
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
        <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-800">
                <div>
                    <h2 className="font-comic text-4xl text-yellow-400 tracking-wider">MULTIVERSE MAP</h2>
                    <p className="text-gray-400 font-mono text-sm">SELECT A NODE TO TIME TRAVEL</p>
                </div>
                <button onClick={onClose} className="comic-btn bg-white text-black px-6 py-2 text-xl hover:bg-gray-200">
                    CLOSE
                </button>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-auto custom-scrollbar relative bg-[#111] cursor-grab active:cursor-grabbing">
                <div className="absolute inset-0 opacity-20 pointer-events-none" 
                     style={{backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                
                <div style={{ width: width, height: height, minWidth: '100%', minHeight: '100%' }} className="relative mx-auto my-10">
                    <svg width={width} height={height} className="absolute top-0 left-0 pointer-events-none">
                        {edges.map((e, i) => (
                            <g key={i}>
                                <path 
                                    d={`M${e.x1},${e.y1} C${e.x1},${(e.y1+e.y2)/2} ${e.x2},${(e.y1+e.y2)/2} ${e.x2},${e.y2}`}
                                    stroke="#444" 
                                    strokeWidth="4" 
                                    fill="none" 
                                />
                                {e.label && (
                                    <g transform={`translate(${(e.x1+e.x2)/2}, ${(e.y1+e.y2)/2})`}>
                                        <rect x="-60" y="-12" width="120" height="24" rx="4" fill="#000" stroke="#666" />
                                        <text x="0" y="5" textAnchor="middle" fill="#ccc" fontSize="10" fontFamily="monospace">
                                            {e.label.length > 20 ? e.label.substring(0, 18) + '..' : e.label}
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
                            <div key={node.id}
                                 onClick={() => handleNodeClick(node.id)}
                                 className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-all hover:scale-110 group z-10`}
                                 style={{ left: node.x, top: node.y }}
                            >
                                <div className={`w-16 h-16 rounded-full border-4 overflow-hidden relative shadow-lg ${isActive ? 'border-yellow-400 ring-4 ring-yellow-400/30' : 'border-gray-600 grayscale hover:grayscale-0'}`}>
                                    {node.data.imageUrl ? (
                                        <img src={node.data.imageUrl} className="w-full h-full object-cover" alt="Node" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-xs text-gray-500">?</div>
                                    )}
                                    {isLeaf && <div className="absolute inset-0 animate-pulse bg-yellow-400/20" />}
                                </div>
                                <div className={`mt-2 px-2 py-1 rounded text-xs font-bold font-comic whitespace-nowrap ${isActive ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-400'}`}>
                                    PAGE {node.data.pageIndex}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
