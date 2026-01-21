
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComicFace, Bubble } from './types';
import { LoadingFX } from './LoadingFX';

interface PanelProps {
    face?: ComicFace;
    allFaces: ComicFace[];
    onChoice: (pageIndex: number, choice: string) => void;
    onOpenBook: () => void;
    onDownload: () => void;
    onReset: () => void;
    onAnimate: (id: string) => void;
    onRegenerate: (id: string) => void;
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
    const [isReading, setIsReading] = useState(false);
    const [isRemixing, setIsRemixing] = useState(false);
    const [isRevisingScript, setIsRevisingScript] = useState(false);
    const [remixPrompt, setRemixPrompt] = useState("");
    const [scriptPrompt, setScriptPrompt] = useState("");
    const [draggedBubble, setDraggedBubble] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedBubble(id);
        e.dataTransfer.effectAllowed = "move";
        const img = new Image();
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; 
        e.dataTransfer.setDragImage(img, 0, 0);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!draggedBubble || !face || !face.bubbles || !onBubbleUpdate) return;

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const updatedBubbles = face.bubbles.map(b => 
            b.id === draggedBubble ? { ...b, x, y } : b
        );
        onBubbleUpdate(face.id, updatedBubbles);
        setDraggedBubble(null);
    };

    const handleBubbleTextChange = (id: string, text: string) => {
        if (!face || !face.bubbles || !onBubbleUpdate) return;
        const updatedBubbles = face.bubbles.map(b => b.id === id ? { ...b, text } : b);
        onBubbleUpdate(face.id, updatedBubbles);
    };

    const handleAddBubble = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!face || !onBubbleUpdate) return;
        const newBubble: Bubble = {
            id: `manual-${Date.now()}`,
            text: "...",
            type: 'speech',
            x: 50,
            y: 50
        };
        onBubbleUpdate(face.id, [...(face.bubbles || []), newBubble]);
    };

    const handleDeleteBubble = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!face || !face.bubbles || !onBubbleUpdate) return;
        onBubbleUpdate(face.id, face.bubbles.filter(b => b.id !== id));
    };

    const cycleBubbleType = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!face || !face.bubbles || !onBubbleUpdate) return;
        const types: Bubble['type'][] = ['speech', 'thought', 'caption', 'sfx'];
        const bubbles = face.bubbles.map(b => {
            if (b.id === id) {
                const nextIndex = (types.indexOf(b.type) + 1) % types.length;
                return { ...b, type: types[nextIndex] };
            }
            return b;
        });
        onBubbleUpdate(face.id, bubbles);
    };

    const handleRemixSubmit = () => {
        if (face && remixPrompt) {
            onRemix(face.id, remixPrompt);
            setIsRemixing(false);
            setRemixPrompt("");
        }
    };

    const handleScriptSubmit = () => {
        if (face && scriptPrompt) {
            onReviseScript(face.id, scriptPrompt);
            setIsRevisingScript(false);
            setScriptPrompt("");
        }
    };

    const getBubbleClasses = (type: Bubble['type']) => {
        switch (type) {
            case 'thought':
                return 'comic-bubble-thought';
            case 'caption':
                return 'comic-bubble-caption';
            case 'sfx':
                return 'comic-bubble-sfx';
            default:
                return 'comic-bubble-speech';
        }
    };

    if (!face) return <div className="w-full h-full bg-gray-950" />;
    
    if (face.type === 'letters') {
        if (face.isLoading && !face.lettersContent) return <div className="w-full h-full"><LoadingFX message="Sorting Mail" /></div>;
        return (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="w-full h-full bg-[#fdfbf7] p-8 overflow-y-auto font-serif relative"
            >
                <div className="border-b-4 border-black mb-6 pb-2">
                    <h2 className="font-comic text-4xl text-black">LETTERS TO THE EDITOR</h2>
                </div>
                <div className="flex flex-col gap-6">
                    {face.lettersContent?.map((letter, i) => (
                        <div key={i} className="relative pl-4 border-l-2 border-gray-300">
                             <p className="font-bold text-sm uppercase mb-1">{letter.user}</p>
                             <p className="text-base leading-relaxed text-gray-800 italic">"{letter.text}"</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        );
    }

    if (face.isLoading && !face.imageUrl) {
        return <div className="w-full h-full"><LoadingFX message={face.type === 'cover' ? "Painting Cover" : "Inking Panel"} /></div>;
    }
    
    const isFullBleed = face.type === 'cover' || face.type === 'back_cover';

    return (
        <motion.div 
            className={`panel-container relative group ${isFullBleed ? '!p-0 !bg-[#0a0a0a]' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
        >
            <div className="gloss"></div>
            
            {face.videoUrl ? (
                 <video src={face.videoUrl} autoPlay loop muted playsInline className={`panel-image ${isFullBleed ? '!object-cover' : ''}`} />
            ) : (
                 face.imageUrl && <motion.img 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ duration: 0.5 }}
                    src={face.imageUrl} alt="Comic panel" 
                    className={`panel-image ${isFullBleed ? '!object-cover' : ''}`} 
                 />
            )}

            {/* Render Dynamic HTML Bubbles */}
            <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                <AnimatePresence>
                {face.bubbles?.map((b, i) => (
                    <motion.div
                        key={b.id}
                        initial={{ scale: 0, opacity: 0, rotate: i % 2 === 0 ? -10 : 10 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 400, 
                            damping: 15, 
                            delay: 0.2 + (i * 0.15) 
                        }}
                        draggable
                        onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, b.id)}
                        onDoubleClick={(e) => cycleBubbleType(e, b.id)}
                        className={`absolute pointer-events-auto cursor-move group/bubble ${getBubbleClasses(b.type)}`}
                        style={{ 
                            left: `${b.x}%`, 
                            top: `${b.y}%`, 
                            transform: 'translate(-50%, -50%)', 
                        }}
                    >
                        {/* Bubble Tail for Speech */}
                        {b.type === 'speech' && <div className="bubble-tail" />}
                        
                        {/* Control Overlays */}
                        <button 
                            onClick={(e) => handleDeleteBubble(e, b.id)}
                            className="absolute -top-4 -right-4 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xs border-2 border-black shadow opacity-0 group-hover/bubble:opacity-100 transition-opacity z-50 hover:bg-red-600"
                        >
                            ×
                        </button>

                        <div 
                            contentEditable 
                            suppressContentEditableWarning
                            onBlur={(e) => handleBubbleTextChange(b.id, e.currentTarget.innerText)}
                            className="bubble-content"
                        >
                            {b.text}
                        </div>
                    </motion.div>
                ))}
                </AnimatePresence>
            </div>
            
            {/* Overlays */}
            {face.isAnimating && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-30">
                     <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4" />
                     <h3 className="text-yellow-400 font-comic text-2xl">REMIXING / ANIMATING...</h3>
                </div>
            )}

            {isRemixing && (
                <div className="absolute inset-0 bg-black/80 z-40 flex flex-col items-center justify-center p-6 animate-in fade-in">
                    <h3 className="text-white font-comic text-2xl mb-4">REMIX IMAGE</h3>
                    <textarea 
                        value={remixPrompt}
                        onChange={(e) => setRemixPrompt(e.target.value)}
                        className="w-full h-24 p-2 font-comic text-black mb-4 rounded border-2 border-yellow-400"
                        placeholder="Visual instruction..."
                    />
                    <div className="flex gap-2 w-full">
                        <button onClick={() => setIsRemixing(false)} className="flex-1 py-2 bg-gray-600 text-white font-comic border-2 border-white">CANCEL</button>
                        <button onClick={handleRemixSubmit} className="flex-1 py-2 bg-yellow-400 text-black font-comic border-2 border-black">PAINT</button>
                    </div>
                </div>
            )}

            {isRevisingScript && (
                <div className="absolute inset-0 bg-black/90 z-40 flex flex-col items-center justify-center p-6 animate-in fade-in">
                    <h3 className="text-white font-comic text-2xl mb-4">REVISE SCRIPT</h3>
                    <textarea 
                        value={scriptPrompt}
                        onChange={(e) => setScriptPrompt(e.target.value)}
                        className="w-full h-24 p-2 font-comic text-black mb-4 rounded border-2 border-blue-400"
                        placeholder="Narrative instruction..."
                    />
                    <div className="flex gap-2 w-full">
                        <button onClick={() => setIsRevisingScript(false)} className="flex-1 py-2 bg-gray-600 text-white font-comic border-2 border-white">CANCEL</button>
                        <button onClick={handleScriptSubmit} className="flex-1 py-2 bg-blue-400 text-black font-comic border-2 border-black">REWRITE</button>
                    </div>
                </div>
            )}

            {/* Quick Action Controls */}
            {!face.isAnimating && !isRemixing && !isRevisingScript && (face.type === 'story' || face.type === 'cover') && face.imageUrl && (
                <div className="absolute top-2 right-2 flex flex-col gap-2 z-40 transition-opacity duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                    {!face.videoUrl && (
                        <button onClick={(e) => { e.stopPropagation(); onAnimate(face.id); }} className="control-btn bg-yellow-400" title="Animate (Veo)">🎥</button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); setIsRemixing(true); }} className="control-btn bg-green-400" title="Remix Image">🎨</button>
                    <button onClick={(e) => { e.stopPropagation(); setIsRevisingScript(true); }} className="control-btn bg-orange-300" title="Revise Script">📝</button>
                    <button onClick={(e) => { e.stopPropagation(); onRegenerate(face.id); }} className="control-btn bg-white" title="Regenerate Image">🔄</button>
                    <button onClick={handleAddBubble} className="control-btn bg-blue-300" title="Add Bubble">💬</button>
                </div>
            )}
            
            {/* Choices */}
            {face.isDecisionPage && face.choices.length > 0 && (
                <div className={`absolute bottom-0 inset-x-0 p-6 flex flex-col gap-3 items-center z-20 ${face.resolvedChoice ? 'pointer-events-none opacity-0' : 'bg-gradient-to-t from-black/90 to-transparent'}`}>
                    <p className="text-white font-comic text-xl animate-pulse">MAKE YOUR CHOICE</p>
                    {face.choices.map((choice, i) => (
                        <button key={i} onClick={(e) => { e.stopPropagation(); if(face.pageIndex) onChoice(face.pageIndex, choice); }}
                          className={`comic-btn w-full py-3 text-lg font-bold ${i===0?'bg-yellow-400':'bg-blue-500 text-white'}`}>
                            {choice}
                        </button>
                    ))}
                </div>
            )}

            {face.type === 'cover' && (
                 <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="absolute bottom-20 inset-x-0 flex justify-center z-20"
                 >
                     <button onClick={(e) => { e.stopPropagation(); onOpenBook(); }}
                      disabled={!allFaces.find(f => f.pageIndex === 2)?.imageUrl}
                      className="comic-btn bg-yellow-400 px-10 py-4 text-3xl font-bold hover:scale-105 animate-bounce disabled:animate-none disabled:bg-gray-400">
                         {(!allFaces.find(f => f.pageIndex === 2)?.imageUrl) ? "PRINTING..." : "READ ISSUE #1"}
                     </button>
                 </motion.div>
            )}
        </motion.div>
    );
}
