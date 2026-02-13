
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComicFace, Bubble, ASPECT_RATIOS } from './types';
import { LoadingFX } from './LoadingFX';

interface PanelProps {
    face?: ComicFace;
    allFaces: ComicFace[];
    onChoice: (pageIndex: number, choice: string) => void;
    onOpenBook: () => void;
    onDownload: () => void;
    onReset: () => void;
    onAnimate: (id: string) => void;
    onRegenerate: (id: string, aspectRatio?: string) => void;
    onRemix: (id: string, instruction: string) => void;
    onReviseScript: (id: string, instruction: string) => void;
    onReadAloud: (text: string, context?: string) => Promise<void>;
    onExportImages?: () => void;
    onBubbleUpdate?: (pageId: string, bubbles: Bubble[]) => void;
}

export const Panel: React.FC<PanelProps> = ({ 
    face, allFaces, onChoice, onOpenBook, onDownload, onReset, 
    onAnimate, onRegenerate, onRemix, onReviseScript, onReadAloud, onExportImages, onBubbleUpdate
}) => {
    const [isRemixing, setIsRemixing] = useState(false);
    const [isRevisingScript, setIsRevisingScript] = useState(false);
    const [remixPrompt, setRemixPrompt] = useState("");
    const [scriptPrompt, setScriptPrompt] = useState("");
    const [draggedBubble, setDraggedBubble] = useState<{ id: string, type: 'pos' | 'tail' } | null>(null);
    const [selectedAspectRatio, setSelectedAspectRatio] = useState("1:1");

    const handleDragStart = (e: React.DragEvent, id: string, type: 'pos' | 'tail') => {
        setDraggedBubble({ id, type });
        e.dataTransfer.effectAllowed = "move";
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; 
        e.dataTransfer.setDragImage(img, 0, 0);
    };

    const handleDragOver = (e: React.DragEvent) => e.preventDefault();

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!draggedBubble || !face || !face.bubbles || !onBubbleUpdate) return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const updatedBubbles = face.bubbles.map(b => {
            if (b.id === draggedBubble.id) {
                if (draggedBubble.type === 'pos') return { ...b, x, y };
                else return { ...b, tailX: x - b.x, tailY: y - b.y };
            }
            return b;
        });
        onBubbleUpdate(face.id, updatedBubbles);
        setDraggedBubble(null);
    };

    const handleBubbleTextChange = (id: string, text: string) => {
        if (!face?.bubbles || !onBubbleUpdate) return;
        onBubbleUpdate(face.id, face.bubbles.map(b => b.id === id ? { ...b, text } : b));
    };

    const handleAddBubble = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!face || !onBubbleUpdate) return;
        const newBubble: Bubble = { id: `manual-${Date.now()}`, text: "...", type: 'speech', x: 50, y: 50, tailX: 0, tailY: 10 };
        onBubbleUpdate(face.id, [...(face.bubbles || []), newBubble]);
    };

    const handleDeleteBubble = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!face?.bubbles || !onBubbleUpdate) return;
        onBubbleUpdate(face.id, face.bubbles.filter(b => b.id !== id));
    };

    const cycleBubbleType = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!face?.bubbles || !onBubbleUpdate) return;
        const types: Bubble['type'][] = ['speech', 'thought', 'caption', 'sfx'];
        onBubbleUpdate(face.id, face.bubbles.map(b => {
            if (b.id === id) {
                const nextIndex = (types.indexOf(b.type) + 1) % types.length;
                return { ...b, type: types[nextIndex] };
            }
            return b;
        }));
    };

    const handleRemixSubmit = () => {
        if (face && remixPrompt) { onRemix(face.id, remixPrompt); setIsRemixing(false); setRemixPrompt(""); }
    };

    const handleScriptSubmit = () => {
        if (face && scriptPrompt) { onReviseScript(face.id, scriptPrompt); setIsRevisingScript(false); setScriptPrompt(""); }
    };

    const getBubbleClasses = (type: Bubble['type']) => {
        switch (type) {
            case 'thought': return 'comic-bubble-thought';
            case 'caption': return 'comic-bubble-caption';
            case 'sfx': return 'comic-bubble-sfx';
            default: return 'comic-bubble-speech';
        }
    };

    const renderPanels = () => {
        if (!face) return null;
        if (!face.panels || face.panels.length === 0) {
            return face.imageUrl ? (
                face.videoUrl ? 
                <video src={face.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" /> :
                <img src={face.imageUrl} className="w-full h-full object-cover" alt="Panel" />
            ) : null;
        }
        const layoutClass = {
            'single': 'grid-cols-1 grid-rows-1',
            '2_vertical': 'grid-cols-1 grid-rows-2 gap-2',
            '2x2_grid': 'grid-cols-2 grid-rows-2 gap-2',
            '3_hybrid': 'grid-cols-2 grid-rows-2 gap-2'
        }[face.layout] || 'grid-cols-1';

        return (
            <div className={`grid w-full h-full bg-white ${layoutClass} p-1`}>
                {face.panels.map((panel, i) => {
                    const spanClass = (face.layout === '3_hybrid' && i === 0) ? 'col-span-2' : '';
                    return (
                        <div key={i} className={`relative overflow-hidden border-4 border-black bg-gray-100 ${spanClass}`}>
                             {panel.imageUrl ? (
                                <img src={panel.imageUrl} className="w-full h-full object-cover" alt={`Panel ${i}`} />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 animate-pulse text-gray-400 font-comic">INKING...</div>
                             )}
                        </div>
                    );
                })}
            </div>
        );
    };

    if (!face) return <div className="w-full h-full bg-gray-950" />;
    
    if (face.type === 'letters') {
        if (face.isLoading && !face.lettersContent) return <div className="w-full h-full"><LoadingFX message="Sorting Mail" /></div>;
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full bg-[#fdfbf7] p-8 overflow-y-auto font-serif relative">
                <div className="border-b-4 border-black mb-6 pb-2"><h2 className="font-comic text-4xl text-black">LETTERS</h2></div>
                <div className="flex flex-col gap-6">{face.lettersContent?.map((l, i) => <div key={i} className="pl-4 border-l-2 border-gray-300"><p className="font-bold text-sm uppercase">{l.user}</p><p className="italic">"{l.text}"</p></div>)}</div>
            </motion.div>
        );
    }

    if (face.isLoading && (!face.panels || face.panels.every(p => !p.imageUrl)) && !face.imageUrl) {
        return <div className="w-full h-full"><LoadingFX message={face.type === 'cover' ? "Painting Cover" : "Inking Page"} /></div>;
    }

    const isFullBleed = face.type === 'cover' || face.type === 'back_cover';

    return (
        <motion.div 
            className={`panel-container relative group ${isFullBleed ? '!p-0 !bg-[#0a0a0a]' : ''}`}
            onDragOver={handleDragOver} onDrop={handleDrop}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
            <div className="gloss"></div>
            {renderPanels()}

            <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none">
                <AnimatePresence>
                {face.bubbles?.map((b, i) => (
                    <motion.div
                        key={b.id}
                        initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0 }}
                        className={`absolute cursor-move pointer-events-auto group/bubble ${getBubbleClasses(b.type)}`}
                        style={{ left: `${b.x}%`, top: `${b.y}%`, transform: 'translate(-50%, -50%)' }}
                        draggable
                        onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, b.id, 'pos')}
                        onDoubleClick={(e) => cycleBubbleType(e, b.id)}
                    >
                        {/* Bubble Tail Handle */}
                        {(b.type === 'speech' || b.type === 'thought') && (
                            <div 
                                draggable
                                onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, b.id, 'tail')}
                                className="absolute w-4 h-4 bg-yellow-400 border border-black rounded-full opacity-0 group-hover/bubble:opacity-100 cursor-crosshair z-50"
                                style={{ left: `calc(50% + ${b.tailX || 0}%)`, top: `calc(50% + ${b.tailY || 0}%)`, transform: 'translate(-50%, -50%)' }}
                            />
                        )}

                        {/* SVG Tail rendering */}
                        {b.type === 'speech' && b.tailX !== undefined && (
                            <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" style={{ transform: 'translate(-50%, -50%)', left: '50%', top: '50%' }}>
                                <path 
                                    d={`M 0 0 L ${b.tailX * 2} ${b.tailY! * 2} L 10 0 Z`} 
                                    fill="white" stroke="black" strokeWidth="2" 
                                />
                            </svg>
                        )}

                        <button onClick={(e) => handleDeleteBubble(e, b.id)} className="absolute -top-4 -right-4 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xs border-2 border-black opacity-0 group-hover/bubble:opacity-100 transition-opacity" aria-label="Delete bubble">×</button>
                        <div contentEditable suppressContentEditableWarning onBlur={(e) => handleBubbleTextChange(b.id, e.currentTarget.innerText)} className="bubble-content min-w-[20px] focus:outline-none">{b.text}</div>
                    </motion.div>
                ))}
                </AnimatePresence>
            </div>
            
            {(isRemixing || isRevisingScript) && (
                <div className="absolute inset-0 bg-black/80 z-40 flex flex-col items-center justify-center p-6">
                    <h3 className="text-white font-comic text-2xl mb-4">{isRemixing ? "REMIX IMAGE" : "REVISE SCRIPT"}</h3>
                    <textarea value={isRemixing ? remixPrompt : scriptPrompt} onChange={(e) => isRemixing ? setRemixPrompt(e.target.value) : setScriptPrompt(e.target.value)} className="w-full h-24 p-2 mb-4 rounded text-black focus:outline-none focus:ring-4 focus:ring-yellow-400" placeholder="Instruction..." />
                    <div className="flex gap-2 w-full">
                        <button onClick={() => { setIsRemixing(false); setIsRevisingScript(false); }} className="flex-1 py-2 bg-gray-600 text-white">CANCEL</button>
                        <button onClick={isRemixing ? handleRemixSubmit : handleScriptSubmit} className="flex-1 py-2 bg-yellow-400 text-black">GO</button>
                    </div>
                </div>
            )}

            {!face.isAnimating && !isRemixing && !isRevisingScript && (face.type === 'story' || face.type === 'cover') && (
                <div className="absolute top-2 right-2 flex flex-col gap-2 z-40 transition-opacity duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100">
                    {!face.videoUrl && <button onClick={(e) => { e.stopPropagation(); onAnimate(face.id); }} className="control-btn bg-yellow-400" title="Animate" aria-label="Animate Panel">🎥</button>}
                    <button onClick={(e) => { e.stopPropagation(); setIsRemixing(true); }} className="control-btn bg-green-400" title="Remix" aria-label="Remix Image">🎨</button>
                    <button onClick={(e) => { e.stopPropagation(); setIsRevisingScript(true); }} className="control-btn bg-orange-300" title="Revise" aria-label="Revise Script">📝</button>
                    <button onClick={(e) => { e.stopPropagation(); onRegenerate(face.id, selectedAspectRatio); }} className="control-btn bg-white" title="Redraw" aria-label="Redraw Panel">🔄</button>
                    <button onClick={(e) => { e.stopPropagation(); if(onDownload) onDownload(); }} className="control-btn bg-blue-500 text-white" title="Export" aria-label="Export Image">💾</button>
                    <button onClick={handleAddBubble} className="control-btn bg-blue-300" title="Add Bubble" aria-label="Add Speech Bubble">💬</button>
                    
                    {/* Aspect Ratio Selector for Regenerate */}
                    <select 
                        onClick={e => e.stopPropagation()}
                        value={selectedAspectRatio} 
                        onChange={e => setSelectedAspectRatio(e.target.value)}
                        className="control-btn w-auto text-xs px-1 font-sans bg-gray-100 hover:bg-gray-200"
                        title="Target Aspect Ratio"
                    >
                        {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
            )}
            
            {face.isDecisionPage && face.choices.length > 0 && (
                <div className={`absolute bottom-0 inset-x-0 p-6 flex flex-col gap-3 items-center z-20 ${face.resolvedChoice ? 'pointer-events-none opacity-0' : 'bg-gradient-to-t from-black/90 to-transparent'}`}>
                    <p className="text-white font-comic text-xl animate-pulse">MAKE YOUR CHOICE</p>
                    {face.choices.map((choice, i) => (
                        <button key={i} onClick={(e) => { e.stopPropagation(); if(face.pageIndex) onChoice(face.pageIndex, choice); }} className={`comic-btn w-full py-3 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-white ${i===0?'bg-yellow-400 text-black':'bg-blue-500 text-white'}`}>{choice}</button>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
