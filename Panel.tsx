
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComicFace, Bubble, ASPECT_RATIOS } from './types';
import { LoadingFX } from './LoadingFX';
import { soundManager } from './SoundManager';

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
    onReadAloud: (text: string, voiceName?: string) => Promise<void>;
    onExportImages?: () => void;
    onBubbleUpdate?: (pageId: string, bubbles: Bubble[]) => void;
}

const ComicSkeleton = ({ message, isAnimating = true }: { message: string, isAnimating?: boolean }) => (
    <div className="w-full h-full bg-gray-100 flex flex-col p-4 relative overflow-hidden">
        {/* Halftone dots background */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '12px 12px' }}></div>
        
        <div className={`w-full h-full flex flex-col gap-4 ${isAnimating ? 'animate-pulse opacity-60' : 'opacity-30'}`}>
            {/* Image Placeholder */}
            <div className="flex-1 bg-gray-300 rounded-lg border-4 border-dashed border-gray-400 flex items-center justify-center relative overflow-hidden">
                {/* Diagonal lines inside image placeholder */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 10px)' }}></div>
                <span className="font-comic text-gray-500 text-xl font-bold z-10 bg-gray-200/80 px-3 py-1 rounded shadow-sm">{message}</span>
            </div>
            
            {/* Text Placeholders */}
            <div className="h-4 bg-gray-300 rounded-full w-5/6"></div>
            <div className="h-4 bg-gray-300 rounded-full w-4/6"></div>
            <div className="h-4 bg-gray-300 rounded-full w-2/6"></div>
        </div>
    </div>
);

export const Panel: React.FC<PanelProps> = ({ 
    face, allFaces, onChoice, onOpenBook, onDownload, onReset, 
    onAnimate, onRegenerate, onRemix, onReviseScript, onReadAloud, onExportImages, onBubbleUpdate
}) => {
    const [isRemixing, setIsRemixing] = useState(false);
    const [isRevisingScript, setIsRevisingScript] = useState(false);
    const [remixPrompt, setRemixPrompt] = useState("");
    const [scriptPrompt, setScriptPrompt] = useState("");
    
    const [draggedBubble, setDraggedBubble] = useState<{ id: string, type: 'pos' | 'tail' } | null>(null);
    const [draggedCoords, setDraggedCoords] = useState<{ x: number, y: number } | null>(null);
    const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);

    const [selectedAspectRatio, setSelectedAspectRatio] = useState("1:1");

    const handlePointerDown = (e: React.PointerEvent, id: string, type: 'pos' | 'tail') => {
        if ((e.target as HTMLElement).isContentEditable) {
            e.stopPropagation();
            setSelectedBubbleId(id);
            return;
        }
        if ((e.target as HTMLElement).tagName.toLowerCase() === 'button') return;
        
        e.preventDefault();
        e.stopPropagation();
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setDraggedBubble({ id, type });
        setSelectedBubbleId(id);
        soundManager.play('pop');
        
        const container = document.getElementById(`panel-${face?.id}`);
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setDraggedCoords({ x, y });
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!draggedBubble) return;
        e.preventDefault();
        e.stopPropagation();
        const container = document.getElementById(`panel-${face?.id}`);
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setDraggedCoords({ x, y });
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!draggedBubble || !face || !face.bubbles || !onBubbleUpdate) return;
        e.preventDefault();
        e.stopPropagation();
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        
        const container = document.getElementById(`panel-${face.id}`);
        if (!container) return;
        const rect = container.getBoundingClientRect();
        let x = ((e.clientX - rect.left) / rect.width) * 100;
        let y = ((e.clientY - rect.top) / rect.height) * 100;
        
        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));

        const updatedBubbles = face.bubbles.map(b => {
            if (b.id === draggedBubble.id) {
                if (draggedBubble.type === 'pos') return { ...b, x, y };
                else return { ...b, tailX: x, tailY: y };
            }
            return b;
        });
        onBubbleUpdate(face.id, updatedBubbles);
        setDraggedBubble(null);
        setDraggedCoords(null);
        const bubble = face.bubbles.find(b => b.id === draggedBubble.id);
        if (bubble) playBubbleSound(bubble.type);
        else soundManager.play('click');
    };

    const playBubbleSound = (type: Bubble['type']) => {
        switch (type) {
            case 'thought': soundManager.play('swoosh'); break;
            case 'sfx': soundManager.play('magic'); break;
            case 'caption': soundManager.play('flip'); break;
            default: soundManager.play('pop'); break;
        }
    };

    const handleBubbleTextChange = (id: string, text: string) => {
        if (!face?.bubbles || !onBubbleUpdate) return;
        const bubble = face.bubbles.find(b => b.id === id);
        onBubbleUpdate(face.id, face.bubbles.map(b => b.id === id ? { ...b, text } : b));
        if (bubble) playBubbleSound(bubble.type);
    };

    const handleAddBubble = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!face || !onBubbleUpdate) return;
        const newBubble: Bubble = { id: `manual-${Date.now()}`, text: "...", type: 'speech', x: 50, y: 50, tailX: 50, tailY: 80 };
        onBubbleUpdate(face.id, [...(face.bubbles || []), newBubble]);
        playBubbleSound('speech');
    };

    const handleDeleteBubble = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!face?.bubbles || !onBubbleUpdate) return;
        onBubbleUpdate(face.id, face.bubbles.filter(b => b.id !== id));
        soundManager.play('swoosh');
        if (selectedBubbleId === id) setSelectedBubbleId(null);
    };

    const cycleBubbleType = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!face?.bubbles || !onBubbleUpdate) return;
        const types: Bubble['type'][] = ['speech', 'thought', 'caption', 'sfx'];
        let newType: Bubble['type'] = 'speech';
        onBubbleUpdate(face.id, face.bubbles.map(b => {
            if (b.id === id) {
                const nextIndex = (types.indexOf(b.type) + 1) % types.length;
                newType = types[nextIndex];
                return { ...b, type: newType };
            }
            return b;
        }));
        playBubbleSound(newType);
    };

    const handleRemixSubmit = () => {
        if (face && remixPrompt) { onRemix(face.id, remixPrompt); setIsRemixing(false); setRemixPrompt(""); soundManager.play('magic'); }
    };

    const handleScriptSubmit = () => {
        if (face && scriptPrompt) { onReviseScript(face.id, scriptPrompt); setIsRevisingScript(false); setScriptPrompt(""); soundManager.play('magic'); }
    };

    const handleReadAloudClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!face) return;
        soundManager.play('click');
        let textToRead = "";
        if (face.bubbles && face.bubbles.length > 0) {
            textToRead = face.bubbles.map(b => b.text).join(". ");
        } else if (face.narrative && face.narrative.panels) {
            textToRead = face.narrative.panels.map(p => p.description).join(". ");
        }
        if (textToRead) {
            let voiceName = undefined;
            if (face.narrative?.focus_char) {
                const role = face.narrative.focus_char;
                voiceName = role === 'hero' ? 'Fenrir' : role === 'friend' ? 'Puck' : role === 'villain' ? 'Charon' : undefined;
            }
            onReadAloud(textToRead, voiceName);
        }
    };

    const getBubbleClasses = (type: Bubble['type']) => {
        switch (type) {
            case 'thought': return 'comic-bubble-thought';
            case 'caption': return 'comic-bubble-caption';
            case 'sfx': return 'comic-bubble-sfx';
            default: return 'comic-bubble-speech';
        }
    };

    const getRenderCoords = (b: Bubble) => {
        let x = b.x;
        let y = b.y;
        
        // If drag is active for position, override x,y
        if (draggedBubble?.id === b.id && draggedBubble.type === 'pos' && draggedCoords) {
            x = draggedCoords.x;
            y = draggedCoords.y;
        }

        // Default tail to reasonable offset if undefined
        let tx = b.tailX !== undefined ? b.tailX : x;
        let ty = b.tailY !== undefined ? b.tailY : Math.min(y + 20, 100);

        // If drag is active for tail, override tx,ty
        if (draggedBubble?.id === b.id && draggedBubble.type === 'tail' && draggedCoords) {
            tx = draggedCoords.x;
            ty = draggedCoords.y;
        }

        return { x, y, tx, ty };
    };

    // Construct SVG path for the speech tail
    const makeTailPath = (x: number, y: number, tx: number, ty: number) => {
        const w = 4; // Base width
        const dx = tx - x;
        const dy = ty - y;
        const len = Math.sqrt(dx*dx + dy*dy);
        if (len < 1) return "";
        
        const nx = -dy / len;
        const ny = dx / len;
        
        const x1 = x + nx * w;
        const y1 = y + ny * w;
        const x2 = x - nx * w;
        const y2 = y - ny * w;
        
        return `M ${x1},${y1} L ${tx},${ty} L ${x2},${y2} Z`;
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

        const loadingMessages = ['Drawing...', 'Inking...', 'Coloring...'];

        return (
            <div className={`grid w-full h-full bg-white ${layoutClass} p-1`}>
                {face.panels.map((panel, i) => {
                    const spanClass = (face.layout === '3_hybrid' && i === 0) ? 'col-span-2' : '';
                    const isGenerating = face.isLoading && !panel.imageUrl && !panel.videoUrl;
                    const loadingMsg = loadingMessages[i % loadingMessages.length];

                    return (
                        <div key={i} className={`relative overflow-hidden border-4 border-black bg-gray-100 ${spanClass}`}>
                             {panel.videoUrl ? (
                                 <video src={panel.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                             ) : panel.imageUrl ? (
                                <img src={panel.imageUrl} className="w-full h-full object-cover" alt={`Panel ${i}`} />
                             ) : isGenerating ? (
                                <div className="w-full h-full"><ComicSkeleton message={loadingMsg} isAnimating={true} /></div>
                             ) : (
                                <div className="w-full h-full"><ComicSkeleton message="WAITING..." isAnimating={false} /></div>
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

    if (face.isLoading && (!face.panels || face.panels.length === 0) && !face.imageUrl && !face.videoUrl) {
        return <div className="w-full h-full"><LoadingFX message={face.type === 'cover' ? "Painting Cover" : "Inking Page"} /></div>;
    }

    const isFullBleed = face.type === 'cover' || face.type === 'back_cover';

    return (
        <motion.div 
            id={`panel-${face.id}`}
            className={`panel-container relative group ${isFullBleed ? '!p-0 !bg-[#0a0a0a]' : ''}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => setSelectedBubbleId(null)}
        >
            <div className="gloss"></div>
            {renderPanels()}

            {/* SVG Layer for Tails - Behind Bubbles */}
            <div className="absolute inset-0 z-10 pointer-events-none w-full h-full overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {face.bubbles?.filter(b => b.type === 'speech' || b.type === 'thought').map(b => {
                        const { x, y, tx, ty } = getRenderCoords(b);
                        const isDraggingTail = draggedBubble?.id === b.id && draggedBubble.type === 'tail';

                        if (b.type === 'speech') {
                            return (
                                <g key={`tail-${b.id}`}>
                                    <path 
                                        d={makeTailPath(x, y, tx, ty)}
                                        fill="white" stroke="black" strokeWidth="0.5"
                                    />
                                    {isDraggingTail && (
                                         <line x1={x} y1={y} x2={tx} y2={ty} stroke="red" strokeWidth="0.3" strokeDasharray="1,1" />
                                    )}
                                </g>
                            );
                        } else {
                            // Thought bubbles use dots
                            return (
                                <g key={`tail-${b.id}`}>
                                    <circle cx={(x + tx)/2} cy={(y + ty)/2} r="2" fill="white" stroke="black" strokeWidth="0.5" />
                                    <circle cx={tx} cy={ty} r="1" fill="white" stroke="black" strokeWidth="0.5" />
                                    {isDraggingTail && (
                                         <line x1={x} y1={y} x2={tx} y2={ty} stroke="red" strokeWidth="0.3" strokeDasharray="1,1" />
                                    )}
                                </g>
                            )
                        }
                    })}
                </svg>
            </div>

            <div className="absolute inset-0 z-20 pointer-events-none">
                <AnimatePresence>
                {face.bubbles?.map((b, i) => {
                    const { x, y, tx, ty } = getRenderCoords(b);
                    const isDraggingThis = draggedBubble?.id === b.id;

                    return (
                        <React.Fragment key={b.id}>
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0 }}
                                className={`absolute cursor-move pointer-events-auto group/bubble ${getBubbleClasses(b.type)} ${isDraggingThis && draggedBubble.type === 'pos' ? 'opacity-80 z-50 ring-2 ring-yellow-400' : ''}`}
                                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)', touchAction: 'none' }}
                                onPointerDown={(e) => handlePointerDown(e, b.id, 'pos')}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerUp}
                                onDoubleClick={(e) => cycleBubbleType(e, b.id)}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button onClick={(e) => handleDeleteBubble(e, b.id)} className={`absolute -top-4 -right-4 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xs border-2 border-black transition-opacity ${selectedBubbleId === b.id ? 'opacity-100' : 'opacity-0 group-hover/bubble:opacity-100'}`} aria-label="Delete bubble">×</button>
                                <div contentEditable suppressContentEditableWarning onBlur={(e) => handleBubbleTextChange(b.id, e.currentTarget.innerText)} className="bubble-content min-w-[20px] focus:outline-none">{b.text}</div>
                            </motion.div>
                            
                            {/* Draggable Tail Target Handle */}
                            {(b.type === 'speech' || b.type === 'thought') && (
                                <div
                                    onPointerDown={(e) => handlePointerDown(e, b.id, 'tail')}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={handlePointerUp}
                                    onPointerCancel={handlePointerUp}
                                    className={`absolute w-6 h-6 rounded-full cursor-crosshair z-30 pointer-events-auto flex items-center justify-center transition-all ${isDraggingThis && draggedBubble.type === 'tail' ? 'opacity-100 scale-125 bg-red-500 border-2 border-white shadow-md' : 'opacity-60 hover:opacity-100 bg-yellow-400 border border-black hover:scale-110'}`}
                                    style={{ left: `${tx}%`, top: `${ty}%`, transform: 'translate(-50%, -50%)', touchAction: 'none' }}
                                    title="Drag tail to speaker"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {(isDraggingThis && draggedBubble.type === 'tail') && (
                                        <div className="w-1 h-1 bg-white rounded-full" />
                                    )}
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
                </AnimatePresence>
            </div>
            
            {(isRemixing || isRevisingScript) && (
                <div className="absolute inset-0 bg-black/80 z-40 flex flex-col items-center justify-center p-6">
                    <h3 className="text-white font-comic text-2xl mb-4">{isRemixing ? "REMIX IMAGE" : "REVISE SCRIPT"}</h3>
                    <textarea value={isRemixing ? remixPrompt : scriptPrompt} onChange={(e) => isRemixing ? setRemixPrompt(e.target.value) : setScriptPrompt(e.target.value)} className="w-full h-24 p-2 mb-4 rounded text-black focus:outline-none focus:ring-4 focus:ring-yellow-400" placeholder="Instruction..." />
                    <div className="flex gap-2 w-full">
                        <button onClick={() => { soundManager.play('click'); setIsRemixing(false); setIsRevisingScript(false); }} className="flex-1 py-2 bg-gray-600 text-white">CANCEL</button>
                        <button onClick={isRemixing ? handleRemixSubmit : handleScriptSubmit} className="flex-1 py-2 bg-yellow-400 text-black">GO</button>
                    </div>
                </div>
            )}

            {!face.isAnimating && !isRemixing && !isRevisingScript && (face.type === 'story' || face.type === 'cover') && (
                <div className="absolute top-2 right-2 flex flex-col gap-2 z-40 transition-opacity duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100">
                    {!face.videoUrl && <button onClick={(e) => { e.stopPropagation(); soundManager.play('magic'); onAnimate(face.id); }} className="control-btn bg-yellow-400 w-10 h-10 md:w-10 md:h-10 text-xl border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:scale-110 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all" title="Animate this panel with AI video" aria-label="Animate Panel">🎥</button>}
                    <button onClick={(e) => { e.stopPropagation(); soundManager.play('click'); setIsRemixing(true); }} className="control-btn bg-green-400 w-10 h-10 md:w-10 md:h-10 text-xl border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:scale-110 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all" title="Modify this image with a text prompt" aria-label="Remix Image">🎨</button>
                    <button onClick={(e) => { e.stopPropagation(); soundManager.play('click'); setIsRevisingScript(true); }} className="control-btn bg-orange-300 w-10 h-10 md:w-10 md:h-10 text-xl border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:scale-110 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all" title="Rewrite the script for this page" aria-label="Revise Script">📝</button>
                    <button onClick={(e) => { e.stopPropagation(); soundManager.play('magic'); onRegenerate(face.id, selectedAspectRatio); }} className="control-btn bg-white w-10 h-10 md:w-10 md:h-10 text-xl border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:scale-110 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all" title="Redraw this panel with a new AI image" aria-label="Redraw Panel">🔄</button>
                    <button onClick={(e) => { e.stopPropagation(); soundManager.play('success'); if(onDownload) onDownload(); }} className="control-btn bg-blue-500 text-white w-10 h-10 md:w-10 md:h-10 text-xl border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:scale-110 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all" title="Save this panel as an image" aria-label="Export Image">💾</button>
                    <button onClick={handleAddBubble} className="control-btn bg-blue-300 w-10 h-10 md:w-10 md:h-10 text-xl border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:scale-110 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all" title="Add a new speech bubble to this panel" aria-label="Add Speech Bubble">💬</button>
                    <button onClick={handleReadAloudClick} className="control-btn bg-purple-400 w-10 h-10 md:w-10 md:h-10 text-xl border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:scale-110 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all" title="Read panel text aloud" aria-label="Read Aloud">🔊</button>
                    
                    {/* Aspect Ratio Selector for Regenerate */}
                    <select 
                        onClick={e => e.stopPropagation()}
                        value={selectedAspectRatio} 
                        onChange={e => { soundManager.play('click'); setSelectedAspectRatio(e.target.value); }}
                        className="control-btn w-auto h-10 md:h-10 text-xs px-2 font-comic font-bold bg-gray-100 hover:bg-yellow-200 border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] cursor-pointer"
                        title="Target Aspect Ratio"
                    >
                        {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
            )}
            
            {face.isDecisionPage && face.choices.length > 0 && (
                <div className={`absolute bottom-0 inset-x-0 p-4 md:p-6 flex flex-col gap-2 md:gap-3 items-center z-20 ${face.resolvedChoice ? 'pointer-events-none opacity-0' : 'bg-gradient-to-t from-black/90 to-transparent'}`}>
                    <p className="text-white font-comic text-lg md:text-xl animate-pulse">MAKE YOUR CHOICE</p>
                    {face.choices.map((choice, i) => (
                        <button key={i} onClick={(e) => { e.stopPropagation(); soundManager.play('success'); if(face.pageIndex) onChoice(face.pageIndex, choice); }} className={`comic-btn w-full py-3 md:py-4 text-base md:text-lg font-bold focus:outline-none focus:ring-4 focus:ring-white ${i===0?'bg-yellow-400 text-black':'bg-blue-500 text-white'}`}>{choice}</button>
                    ))}
                </div>
            )}
        </motion.div>
    );
}
