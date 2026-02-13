
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { ComicFace, TOTAL_PAGES, Persona, Bubble, WorldState } from './types';
import { Panel } from './Panel';
import { soundManager } from './SoundManager';

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
}

export const Book: React.FC<BookProps> = (props) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const smoothX = useSpring(mouseX, { stiffness: 100, damping: 20 });
    const smoothY = useSpring(mouseY, { stiffness: 100, damping: 20 });
    const rotateX = useTransform(smoothY, [-0.5, 0.5], [5, -5]);
    const rotateY = useTransform(smoothX, [-0.5, 0.5], [-5, 5]);

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
    
    const handlePageClick = (i: number) => { 
        soundManager.play('flip'); 
        props.onSheetClick(i); 
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
                        <span>Health</span>
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
                  <span aria-hidden="true">👥</span> CAST
                </button>
                <button onClick={props.onOpenMap} className="bg-blue-400 border-4 border-black px-4 py-2 font-comic text-xl hover:scale-105 shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase flex items-center gap-2" aria-label="Open Multiverse Map">
                  <span aria-hidden="true">🕸️</span> MAP
                </button>
                <button onClick={props.onOpenSettings} className="bg-gray-200 border-4 border-black px-4 py-2 font-comic text-xl hover:scale-105 shadow-[4px_4px_0px_rgba(0,0,0,1)] flex items-center gap-2" aria-label="Open Settings">
                  <span aria-hidden="true">⚙️</span>
                </button>
                <button onClick={props.onExportImages} className="bg-green-400 border-4 border-black px-4 py-2 font-comic text-xl hover:scale-105 shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase flex items-center gap-2" aria-label="Save and Export">
                  <span aria-hidden="true">💾</span> SAVE
                </button>
            </motion.div>
        )}

        <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
            <motion.div className="book" variants={bookVariants} animate={getBookState()} transition={{ type: "spring", stiffness: 40, damping: 15, mass: 1.2 }}>
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
