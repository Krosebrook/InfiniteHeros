
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { ComicFace, TOTAL_PAGES, Persona, Bubble } from './types';
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

    // Interactive Tilt Logic
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    
    // Smooth out the mouse movement
    const smoothX = useSpring(mouseX, { stiffness: 100, damping: 20 });
    const smoothY = useSpring(mouseY, { stiffness: 100, damping: 20 });

    // Map mouse position to rotation (Subtle tilt)
    const rotateX = useTransform(smoothY, [-0.5, 0.5], [5, -5]);
    const rotateY = useTransform(smoothX, [-0.5, 0.5], [-5, 5]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXVal = e.clientX - rect.left;
        const mouseYVal = e.clientY - rect.top;
        
        // Calculate normalized position (-0.5 to 0.5)
        const xPct = (mouseXVal / width) - 0.5;
        const yPct = (mouseYVal / height) - 0.5;
        
        mouseX.set(xPct);
        mouseY.set(yPct);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    const handlePageClick = (i: number) => {
        soundManager.play('flip');
        props.onSheetClick(i);
    };
    
    const sheetsToRender = [];
    if (props.comicFaces.length > 0) {
        sheetsToRender.push({ front: props.comicFaces[0], back: props.comicFaces.find(f => f.pageIndex === 1) });
        for (let i = 2; i <= TOTAL_PAGES; i += 2) {
            sheetsToRender.push({ 
                front: props.comicFaces.find(f => f.pageIndex === i), 
                back: props.comicFaces.find(f => f.pageIndex === i + 1) 
            });
        }
    } else if (props.isSetupVisible) {
        sheetsToRender.push({ front: undefined, back: undefined });
    }

    const bookVariants = {
        closed: { 
            x: 0,
            z: 0,
            rotateX: 0,
            scale: 1,
            filter: "blur(0px) brightness(1)" 
        },
        opened: { 
            x: isMobile ? "0%" : "25%", 
            z: 0,
            rotateX: 0,
            scale: 1,
            filter: "blur(0px) brightness(1)" 
        },
        setup: { 
            x: 0, 
            z: -600, 
            rotateX: 25, 
            y: -50, 
            scale: 0.85, 
            filter: "blur(4px) brightness(0.7)" 
        }
    };

    const getBookState = () => {
        if (props.isSetupVisible) return "setup";
        if (props.currentSheetIndex > 0) return "opened";
        return "closed";
    };

    return (
      <div className="comic-scene" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        {props.isStarted && (
            <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, type: "spring" }}
                className="fixed top-4 right-4 z-[100] flex flex-col gap-3"
            >
                <button onClick={props.onOpenBio} className="bg-yellow-400 border-4 border-black px-4 py-2 font-comic text-xl hover:scale-105 hover:bg-yellow-300 shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase tracking-wider flex items-center gap-2 transition-transform">
                  <span className="text-2xl">👥</span> CAST
                </button>
                
                <button onClick={props.onOpenMap} className="bg-blue-400 border-4 border-black px-4 py-2 font-comic text-xl hover:scale-105 hover:bg-blue-300 shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase tracking-wider flex items-center gap-2 transition-transform">
                  <span className="text-2xl">🕸️</span> MAP
                </button>

                <button onClick={props.onOpenSettings} className="bg-gray-200 border-4 border-black px-4 py-2 font-comic text-xl hover:scale-105 hover:bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase tracking-wider flex items-center gap-2 transition-transform">
                  <span className="text-2xl">⚙️</span>
                </button>
            </motion.div>
        )}

        {/* Tilt Container */}
        <motion.div
            style={{ 
                rotateX, 
                rotateY,
                transformStyle: "preserve-3d"
            }}
        >
            <motion.div 
              className="book"
              variants={bookVariants}
              animate={getBookState()}
              transition={{ 
                type: "spring", 
                stiffness: 40, 
                damping: 15, 
                mass: 1.2 
              }}
            >
              {sheetsToRender.map((sheet, i) => (
                  <motion.div 
                       key={i} 
                       className="paper" 
                       style={{ zIndex: i < props.currentSheetIndex ? i : sheetsToRender.length - i }}
                       onClick={() => handlePageClick(i)}
                       animate={{ rotateY: i < props.currentSheetIndex ? -180 : 0 }}
                       transition={{ 
                           type: "spring", 
                           stiffness: 45, 
                           damping: 12, 
                           mass: 0.8,
                           restSpeed: 0.2
                       }}
                       whileHover={i === props.currentSheetIndex && !props.isSetupVisible ? { 
                           rotateY: -10,
                           transition: { type: "spring", stiffness: 100, damping: 20 } 
                       } : {}}
                  >
                      <div className="front">
                          <Panel 
                            face={sheet.front} allFaces={props.comicFaces} 
                            onChoice={props.onChoice} onOpenBook={props.onOpenBook} 
                            onDownload={props.onDownload} onReset={props.onReset} 
                            onAnimate={props.onAnimate} onRegenerate={props.onRegenerate} 
                            onRemix={props.onRemix} onReviseScript={props.onReviseScript}
                            onReadAloud={props.onReadAloud} 
                            onExportImages={props.onExportImages} onBubbleUpdate={props.onBubbleUpdate}
                          />
                      </div>
                      <div className="back">
                          <Panel 
                            face={sheet.back} allFaces={props.comicFaces} 
                            onChoice={props.onChoice} onOpenBook={props.onOpenBook} 
                            onDownload={props.onDownload} onReset={props.onReset} 
                            onAnimate={props.onAnimate} onRegenerate={props.onRegenerate} 
                            onRemix={props.onRemix} onReviseScript={props.onReviseScript}
                            onReadAloud={props.onReadAloud} 
                            onExportImages={props.onExportImages} onBubbleUpdate={props.onBubbleUpdate}
                          />
                      </div>
                  </motion.div>
              ))}
          </motion.div>
        </motion.div>
      </div>
    );
}
