
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { ComicFace, TOTAL_PAGES, Persona, Bubble, WorldState } from './types';
import { Panel } from './Panel';
import { soundManager } from './SoundManager';
import { t } from './translations';

interface BookProps {
    comicFaces: ComicFace[];
    currentSheetIndex: number;
    isStarted: boolean;
    isSetupVisible: boolean;
    hero: Persona | null;
    friend: Persona | null;
    villain: Persona | null;
    worldState: WorldState;
    onOpenBio: () => void;
    onOpenInventory: () => void;
    onSheetClick: (index: number) => void;
    onChoice: (pageIndex: number, choice: string) => void;
    onOpenBook: () => void;
    onDownload: () => void;
    onReset: () => void;
    onAnimate: (id: string) => void;
    onRegenerate: (id: string) => void;
    onRemix: (id: string, instruction: string) => void;
    onReviseScript: (id: string, instruction: string) => void;
    onReadAloud: (text: string, voiceName?: string) => Promise<void>;
    onExportImages: () => void;
    onGenerateVideo: () => void;
    onBubbleUpdate: (pageId: string, bubbles: Bubble[]) => void;
    onOpenMap: () => void; 
    onOpenSettings: () => void;
    onSaveProgress: () => void;
    onGenerateCover: () => void;
    lang: string;
}

export const Book: React.FC<BookProps> = (props) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothX = useSpring(mouseX, { stiffness: 100, damping: 20 });
    const smoothY = useSpring(mouseY, { stiffness: 100, damping: 20 });
    const rotateX = useTransform(smoothY, [-0.5, 0.5], [5, -5]);
    const rotateY = useTransform(smoothX, [-0.5, 0.5], [-5, 5]);

    // Swipe Gesture Refs
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);
    const isSwiping = useRef(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const xPct = (e.clientX - rect.left) / rect.width - 0.5;
        const yPct = (e.clientY - rect.top) / rect.height - 0.5;
        mouseX.set(xPct);
        mouseY.set(yPct);
    };

    const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };
    
    // Updated logic to support simple "next/prev" click behavior if not swiping
    const handlePageClick = (i: number) => { 
        if (isSwiping.current) return;
        
        soundManager.play('flip'); 
        
        // Smart navigation: 
        // If clicking the current active sheet (right side), go forward
        if (i === props.currentSheetIndex) {
            props.onSheetClick(i + 1);
        } 
        // If clicking the previous sheet (left side), go backward
        else if (i === props.currentSheetIndex - 1) {
            props.onSheetClick(i);
        } else {
            // Fallback for jump
            props.onSheetClick(i); 
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, i: number) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handlePageClick(i);
        }
    };
    
    const sheetsToRender = [];
    if (props.comicFaces.length > 0) {
        sheetsToRender.push({ front: props.comicFaces[0], back: props.comicFaces.find(f => f.pageIndex === 1) });
        for (let i = 2; i <= TOTAL_PAGES; i += 2) {
            sheetsToRender.push({ front: props.comicFaces.find(f => f.pageIndex === i), back: props.comicFaces.find(f => f.pageIndex === i + 1) });
        }
    } else if (props.isSetupVisible) { sheetsToRender.push({ front: undefined, back: undefined }); }

    // Touch Handlers
    const onTouchStart = (e: React.TouchEvent) => {
        touchEndX.current = null;
        touchStartX.current = e.targetTouches[0].clientX;
        isSwiping.current = false;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.targetTouches[0].clientX;
        if (touchStartX.current !== null) {
            const diff = Math.abs(touchStartX.current - touchEndX.current);
            if (diff > 10) isSwiping.current = true; // Mark as swipe if moved significantly
        }
    };

    const onTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        
        const distance = touchStartX.current - touchEndX.current;
        const minSwipeDistance = 50;
        
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            // Swipe Left -> Next Page
            if (props.currentSheetIndex < sheetsToRender.length) {
                soundManager.play('flip');
                props.onSheetClick(props.currentSheetIndex + 1);
            }
        } else if (isRightSwipe) {
            // Swipe Right -> Prev Page
            if (props.currentSheetIndex > 0) {
                soundManager.play('flip');
                props.onSheetClick(props.currentSheetIndex - 1);
            }
        }
        
        // Reset after a short delay to allow click handler to check isSwiping if it fires immediately
        setTimeout(() => { isSwiping.current = false; }, 100);
    };

    const bookVariants = {
        closed: { x: 0, scale: 1, filter: "blur(0px) brightness(1)" },
        opened: { x: isMobile ? "0%" : "25%", scale: 1, filter: "blur(0px) brightness(1)" },
        setup: { x: 0, z: -600, rotateX: 25, y: -50, scale: 0.85, filter: "blur(4px) brightness(0.7)" }
    };

    const getBookState = () => {
        if (props.isSetupVisible) return "setup";
        if (props.currentSheetIndex > 0) return "opened";
        return "closed";
    };

    return (
      <div className="comic-scene" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        {props.isStarted && (
            <>
            {/* Mobile Bottom Navigation */}
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="md:hidden fixed bottom-0 left-0 right-0 z-[150] bg-black border-t-[6px] border-yellow-400 p-2 flex justify-around items-center gap-1 overflow-x-auto no-scrollbar shadow-[0_-4px_10px_rgba(0,0,0,0.5)]" role="navigation" aria-label="Mobile Navigation">
                <button onClick={props.onOpenBio} className="flex flex-col items-center gap-1 min-w-[50px] active:scale-90 transition-transform" title={t(props.lang, "CAST")} aria-label={t(props.lang, "CAST")}>
                    <span className="text-2xl drop-shadow-md" aria-hidden="true">👥</span>
                    <span className="text-[10px] font-comic font-bold text-yellow-400 uppercase tracking-wider">{t(props.lang, "CAST")}</span>
                </button>
                <button onClick={props.onOpenInventory} className="flex flex-col items-center gap-1 min-w-[50px] active:scale-90 transition-transform" title={t(props.lang, "BAG")} aria-label={t(props.lang, "BAG")}>
                    <span className="text-2xl drop-shadow-md" aria-hidden="true">🎒</span>
                    <span className="text-[10px] font-comic font-bold text-yellow-400 uppercase tracking-wider">{t(props.lang, "BAG")}</span>
                </button>
                <button onClick={props.onOpenMap} className="flex flex-col items-center gap-1 min-w-[50px] active:scale-90 transition-transform" title={t(props.lang, "MAP")} aria-label={t(props.lang, "MAP")}>
                    <span className="text-2xl drop-shadow-md" aria-hidden="true">🕸️</span>
                    <span className="text-[10px] font-comic font-bold text-yellow-400 uppercase tracking-wider">{t(props.lang, "MAP")}</span>
                </button>
                <button onClick={props.onGenerateVideo} className="flex flex-col items-center gap-1 min-w-[50px] active:scale-90 transition-transform" title="Video Generator" aria-label="Generate Video">
                    <span className="text-2xl drop-shadow-md" aria-hidden="true">🎬</span>
                    <span className="text-[10px] font-comic font-bold text-yellow-400 uppercase tracking-wider">VIDEO</span>
                </button>
                <button onClick={props.onOpenSettings} className="flex flex-col items-center gap-1 min-w-[50px] active:scale-90 transition-transform" title={t(props.lang, "SETTINGS")} aria-label={t(props.lang, "SETTINGS")}>
                    <span className="text-2xl drop-shadow-md" aria-hidden="true">⚙️</span>
                    <span className="text-[10px] font-comic font-bold text-yellow-400 uppercase tracking-wider">SET</span>
                </button>
                <div className="w-1 h-10 bg-gray-700 mx-1 rounded-full" aria-hidden="true" />
                <div className="flex flex-col gap-1 min-w-[80px]" role="presentation">
                    <div className="flex justify-between text-[10px] font-comic font-bold text-white uppercase tracking-wider">
                        <span>HP</span>
                        <span>{props.worldState.health}%</span>
                    </div>
                    <div 
                        className="h-2 bg-gray-800 border-2 border-white overflow-hidden rounded-sm"
                        role="progressbar"
                        aria-valuenow={props.worldState.health}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={t(props.lang, "HEALTH")}
                    >
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${props.worldState.health}%` }}
                            className={`h-full ${props.worldState.health < 30 ? 'bg-red-600' : 'bg-green-500'} relative`}
                        >
                            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '6px 6px' }}></div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
            </>
        )}

        <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
            <motion.div 
                className="book" 
                variants={bookVariants} 
                animate={getBookState()} 
                transition={{ type: "spring", stiffness: 40, damping: 15, mass: 1.2 }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
              {sheetsToRender.map((sheet, i) => (
                  <motion.div 
                       key={i} 
                       className="paper outline-none focus-visible:ring-4 focus-visible:ring-yellow-400" 
                       style={{ zIndex: i < props.currentSheetIndex ? i : sheetsToRender.length - i }}
                       onClick={() => handlePageClick(i)}
                       onKeyDown={(e) => handleKeyDown(e, i)}
                       tabIndex={0}
                       role="button"
                       aria-label={`Turn to sheet ${i + 1}`}
                       animate={{ rotateY: i < props.currentSheetIndex ? -180 : 0 }}
                       transition={{ type: "spring", stiffness: 45, damping: 12, mass: 0.8 }}
                  >
                      <div className="front">
                          <Panel 
                            face={sheet.front} allFaces={props.comicFaces} 
                            onChoice={props.onChoice} onOpenBook={props.onOpenBook} 
                            onDownload={props.onDownload} onReset={props.onReset} 
                            onAnimate={props.onAnimate} onRegenerate={props.onRegenerate} 
                            onRemix={props.onRemix} onReviseScript={props.onReviseScript}
                            onReadAloud={props.onReadAloud} onExportImages={props.onExportImages} onBubbleUpdate={props.onBubbleUpdate}
                            lang={props.lang}
                          />
                      </div>
                      <div className="back">
                          <Panel 
                            face={sheet.back} allFaces={props.comicFaces} 
                            onChoice={props.onChoice} onOpenBook={props.onOpenBook} 
                            onDownload={props.onDownload} onReset={props.onReset} 
                            onAnimate={props.onAnimate} onRegenerate={props.onRegenerate} 
                            onRemix={props.onRemix} onReviseScript={props.onReviseScript}
                            onReadAloud={props.onReadAloud} onExportImages={props.onExportImages} onBubbleUpdate={props.onBubbleUpdate}
                            lang={props.lang}
                          />
                      </div>
                  </motion.div>
              ))}
          </motion.div>
        </motion.div>
      </div>
    );
}
