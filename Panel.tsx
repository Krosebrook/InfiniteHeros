
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ComicFace, INITIAL_PAGES, GATE_PAGE } from './types';
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
}

export const Panel: React.FC<PanelProps> = ({ face, allFaces, onChoice, onOpenBook, onDownload, onReset, onAnimate, onRegenerate }) => {
    if (!face) return <div className="w-full h-full bg-gray-950" />;
    
    // Letters Page Rendering
    if (face.type === 'letters') {
        if (face.isLoading && !face.lettersContent) return <LoadingFX />;
        return (
            <div className="w-full h-full bg-[#fdfbf7] p-8 overflow-y-auto font-serif relative">
                <div className="border-b-4 border-black mb-6 pb-2">
                    <h2 className="font-comic text-4xl text-black">LETTERS TO THE EDITOR</h2>
                    <p className="font-sans text-xs uppercase tracking-widest text-gray-500">VOICE OF THE MULTIVERSE</p>
                </div>
                
                <div className="flex flex-col gap-6">
                    {face.lettersContent?.map((letter, i) => (
                        <div key={i} className="relative pl-4 border-l-2 border-gray-300">
                             <p className="font-bold text-sm uppercase mb-1">
                                {letter.user} <span className="text-gray-400 font-normal">from {letter.location}</span>
                             </p>
                             <p className="text-base leading-relaxed text-gray-800 italic">"{letter.text}"</p>
                             <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-200 border border-gray-400" />
                        </div>
                    ))}
                </div>
                
                <div className="absolute bottom-4 right-4 opacity-50 rotate-[-10deg] border-4 border-red-600 text-red-600 font-comic text-2xl px-2 py-1">
                    APPROVED
                </div>
            </div>
        );
    }

    if (face.isLoading && !face.imageUrl) return <LoadingFX />;
    
    const isFullBleed = face.type === 'cover' || face.type === 'back_cover';

    return (
        <div className={`panel-container relative group ${isFullBleed ? '!p-0 !bg-[#0a0a0a]' : ''}`}>
            <div className="gloss"></div>
            
            {/* Content: Video or Image */}
            {face.videoUrl ? (
                 <video src={face.videoUrl} autoPlay loop muted playsInline className={`panel-image ${isFullBleed ? '!object-cover' : ''}`} />
            ) : (
                 face.imageUrl && <img src={face.imageUrl} alt="Comic panel" className={`panel-image ${isFullBleed ? '!object-cover' : ''}`} />
            )}
            
            {/* Animate Loading State */}
            {face.isAnimating && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
                     <div className="text-yellow-400 font-comic text-2xl animate-pulse">GENERATING MOTION...</div>
                </div>
            )}

            {/* Utility Controls */}
            {!face.isAnimating && (face.type === 'story' || face.type === 'cover') && face.imageUrl && (
                <div className="absolute top-2 right-2 flex flex-col gap-2 z-40 transition-opacity duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                    {!face.videoUrl && (
                        <button onClick={(e) => { e.stopPropagation(); onAnimate(face.id); }} 
                                className="bg-white/90 p-2 rounded-full border-2 border-black hover:bg-yellow-300 shadow-md transform hover:scale-110 transition-transform"
                                title="Animate with Veo">
                            <span className="text-xl">🎬</span>
                        </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onRegenerate(face.id); }}
                            className="bg-white/90 p-2 rounded-full border-2 border-black hover:bg-blue-300 shadow-md transform hover:scale-110 transition-transform"
                            title="Regenerate Image">
                        <span className="text-xl">🔄</span>
                    </button>
                </div>
            )}
            
            {/* Decision Buttons */}
            {face.isDecisionPage && face.choices.length > 0 && (
                <div className={`absolute bottom-0 inset-x-0 p-6 pb-12 flex flex-col gap-3 items-center justify-end transition-opacity duration-500 ${face.resolvedChoice ? 'opacity-0 pointer-events-none' : 'opacity-100'} bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20`}>
                    <p className="text-white font-comic text-2xl uppercase tracking-widest animate-pulse">What drives you?</p>
                    {face.choices.map((choice, i) => (
                        <button key={i} onClick={(e) => { e.stopPropagation(); if(face.pageIndex) onChoice(face.pageIndex, choice); }}
                          className={`comic-btn w-full py-3 text-xl font-bold tracking-wider ${i===0?'bg-yellow-400 hover:bg-yellow-300':'bg-blue-500 text-white hover:bg-blue-400'}`}>
                            {choice}
                        </button>
                    ))}
                </div>
            )}

            {/* Cover Action */}
            {face.type === 'cover' && (
                 <div className="absolute bottom-20 inset-x-0 flex justify-center z-20">
                     <button onClick={(e) => { e.stopPropagation(); onOpenBook(); }}
                      disabled={!allFaces.find(f => f.pageIndex === GATE_PAGE)?.imageUrl}
                      className="comic-btn bg-yellow-400 px-10 py-4 text-3xl font-bold hover:scale-105 animate-bounce disabled:animate-none disabled:bg-gray-400 disabled:cursor-wait">
                         {(!allFaces.find(f => f.pageIndex === GATE_PAGE)?.imageUrl) ? `PRINTING... ${allFaces.filter(f => f.type==='story' && f.imageUrl && (f.pageIndex||0) <= GATE_PAGE).length}/${INITIAL_PAGES}` : 'READ ISSUE #1'}
                     </button>
                 </div>
            )}

            {/* Back Cover Actions */}
            {face.type === 'back_cover' && (
                <div className="absolute bottom-24 inset-x-0 flex flex-col items-center gap-4 z-20">
                    <button onClick={(e) => { e.stopPropagation(); onDownload(); }} className="comic-btn bg-blue-500 text-white px-8 py-3 text-xl font-bold hover:scale-105">DOWNLOAD ISSUE</button>
                    <button onClick={(e) => { e.stopPropagation(); onReset(); }} className="comic-btn bg-green-500 text-white px-8 py-4 text-2xl font-bold hover:scale-105">CREATE NEW ISSUE</button>
                </div>
            )}
        </div>
    );
}
