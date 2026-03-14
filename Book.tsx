
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
    onReadAloud: (text: string, context?: string) => Promise<void>;
    onExportImages: () => void;
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
            <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="fixed top-4 right-4 z-[100] flex flex-col gap-3">
                {/* Health Bar UI */}
                <div className="bg-black/80 border-2 border-white p-2 flex flex-col gap-1 w-48 shadow-lg">
                    <div className="flex justify-between text-[10px] font-bold text-white uppercase">
                        <span>{t(props.lang, "HEALTH")}</span>
                        <span>{props.worldState.health}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 border border-black overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${props.worldState.health}%` }}
                            className={`h-full ${props.worldState.health < 30 ? 'bg-red-500' : 'bg-green-500'}`}
                        />
                    </div>
                </div>

                <button onClick={props.onOpenBio} className="bg-yellow-400 border-4 border-black px-4 py-2 font-comic text-xl hover:scale-105 shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase flex items-center gap-2" aria-label="Open Character Bios">
                  <span aria-hidden="true">👥</span> {t(props.lang, "CAST")}
                </button>
                <button onClick={props.onOpenInventory} className="bg-orange-400 border-4 border-black px-4 py-2 font-comic text-xl hover:scale-105 shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase flex items-center gap-2" aria-label="Open Inventory">
                  <span aria-hidden="true">🎒</span> {t(props.lang, "BAG")}
                </button>
                <button onClick={props.onOpenMap} className="bg-blue-400 border-4 border-black px-4 py-2 font-comic text-xl hover:scale-105 shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase flex items-center gap-2" aria-label="Open Multiverse Map">
                  <span aria-hidden="true">🕸️</span> {t(props.lang, "MAP")}
                </button>
                <button onClick={props.onOpenSettings} className="bg-gray-200 border-4 border-black px-4 py-2 font-comic text-xl hover:scale-105 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center gap-2" aria-label="Open Settings">
                  <span aria-hidden="true">⚙️</span>
                </button>
                <button onClick={props.onGenerateCover} className="bg-purple-500 border-4 border-black px-4 py-2 font-comic text-xl hover:scale-105 shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase flex items-center gap-2 text-white" aria-label="Generate Cover">
                  <span aria-hidden="true">🎨</span> {t(props.lang, "COVER")}
                </button>
                <button onClick={props.onExportImages} className="bg-green-400 border-4 border-black px-4 py-2 font-comic text-xl hover:scale-105 shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase flex items-center gap-2" aria-label="Export">
                  <span aria-hidden="true">📤</span> {t(props.lang, "EXPORT")}
                </button>
                <button onClick={props.onSaveProgress} className="bg-blue-600 text-white border-4 border-black px-4 py-2 font-comic text-xl hover:scale-105 shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase flex items-center gap-2" aria-label="Save Progress">
                  <span aria-hidden="true">💾</span> {t(props.lang, "SAVE")}
                </button>
            </motion.div>
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
                          />
                      </div>
                  </motion.div>
              ))}
          </motion.div>
        </motion.div>
      </div>
    );
}
