
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ComicFace, TOTAL_PAGES, Persona } from './types';
import { Panel } from './Panel';

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
}

export const Book: React.FC<BookProps> = (props) => {
    const sheetsToRender = [];
    if (props.comicFaces.length > 0) {
        // Sheet 0: Cover (Page 0) + Page 1
        sheetsToRender.push({ front: props.comicFaces[0], back: props.comicFaces.find(f => f.pageIndex === 1) });
        
        // Internal sheets
        for (let i = 2; i <= TOTAL_PAGES; i += 2) {
            sheetsToRender.push({ 
                front: props.comicFaces.find(f => f.pageIndex === i), 
                back: props.comicFaces.find(f => f.pageIndex === i + 1) 
            });
        }
    } else if (props.isSetupVisible) {
        // Placeholder sheet
        sheetsToRender.push({ front: undefined, back: undefined });
    }

    return (
      <>
        {/* Floating Bio Button */}
        {props.isStarted && (
            <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-right-10 duration-700">
                <button 
                  onClick={props.onOpenBio}
                  className="bg-yellow-400 border-4 border-black px-4 py-2 font-comic text-xl hover:scale-105 hover:bg-yellow-300 shadow-[4px_4px_0px_rgba(0,0,0,1)] uppercase tracking-wider flex items-center gap-2"
                >
                  <span className="text-2xl">👥</span> CAST
                </button>
            </div>
        )}

        <div className={`book ${props.currentSheetIndex > 0 ? 'opened' : ''} transition-all duration-1000 ease-in-out`}
           style={ (props.isSetupVisible) ? { transform: 'translateZ(-600px) translateY(-100px) rotateX(20deg) scale(0.9)', filter: 'blur(6px) brightness(0.7)', pointerEvents: 'none' } : {}}>
          {sheetsToRender.map((sheet, i) => (
              <div key={i} className={`paper ${i < props.currentSheetIndex ? 'flipped' : ''}`} style={{ zIndex: i < props.currentSheetIndex ? i : sheetsToRender.length - i }}
                   onClick={() => props.onSheetClick(i)}>
                  <div className="front">
                      <Panel face={sheet.front} allFaces={props.comicFaces} onChoice={props.onChoice} onOpenBook={props.onOpenBook} onDownload={props.onDownload} onReset={props.onReset} onAnimate={props.onAnimate} onRegenerate={props.onRegenerate} />
                  </div>
                  <div className="back">
                      <Panel face={sheet.back} allFaces={props.comicFaces} onChoice={props.onChoice} onOpenBook={props.onOpenBook} onDownload={props.onDownload} onReset={props.onReset} onAnimate={props.onAnimate} onRegenerate={props.onRegenerate} />
                  </div>
              </div>
          ))}
      </div>
      </>
    );
}
