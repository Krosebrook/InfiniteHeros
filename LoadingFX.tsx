
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { soundManager } from './SoundManager';

const TEXT_FX = ["POW!", "BAM!", "ZAP!", "KRAK!", "SKREEE!", "WHOOSH!", "THWIP!", "BOOM!", "SPLORT!", "KA-POW!"];
const TEXT_COLORS = ['text-yellow-400', 'text-red-500', 'text-blue-400', 'text-orange-500', 'text-purple-500', 'text-green-500'];
const BG_COLORS = ['bg-yellow-400', 'bg-red-500', 'bg-blue-400', 'bg-orange-500', 'bg-purple-500', 'bg-green-500'];

interface Particle {
    id: number;
    text: string;
    x: string;
    y: string;
    rot: number;
    scale: number;
    textColor: string;
    shape: 'star' | 'circle' | 'burst' | 'none';
    shapeColor: string;
    anim: string;
}

export const LoadingFX: React.FC = () => {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        // Initial sound
        soundManager.play('flip');

        const interval = setInterval(() => {
            const id = Date.now();
            
            // Random attributes
            const text = TEXT_FX[Math.floor(Math.random() * TEXT_FX.length)];
            const x = `${15 + Math.random() * 70}%`;
            const y = `${15 + Math.random() * 70}%`;
            const rot = Math.random() * 60 - 30; // -30 to 30 deg
            const scale = 0.8 + Math.random() * 0.7; // 0.8 to 1.5
            const textColor = TEXT_COLORS[Math.floor(Math.random() * TEXT_COLORS.length)];
            const shapeColor = BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
            
            // Random shape logic
            const hasShape = Math.random() > 0.4;
            let shape: Particle['shape'] = 'none';
            if (hasShape) {
                const r = Math.random();
                if (r < 0.33) shape = 'star';
                else if (r < 0.66) shape = 'circle';
                else shape = 'burst';
            }

            // Random animation
            const anims = ['comic-pop', 'comic-slide', 'comic-shake'];
            const anim = anims[Math.floor(Math.random() * anims.length)];

            // Play sound occasionally (50% chance)
            if (Math.random() > 0.5) {
                soundManager.play('pop');
            }

            setParticles(prev => {
                // Keep max 5 particles to avoid clutter
                const next = [...prev, { id, text, x, y, rot, scale, textColor, shape, shapeColor, anim }];
                return next.slice(-5); 
            });

        }, 700); 
        
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full bg-white overflow-hidden relative border-r-4 border-gray-300">
            <style>{`
              @keyframes comic-pop {
                  0% { transform: translate(-50%, -50%) scale(0) rotate(var(--rot)); opacity: 0; }
                  50% { transform: translate(-50%, -50%) scale(1.3) rotate(var(--rot)); opacity: 1; }
                  70% { transform: translate(-50%, -50%) scale(1.0) rotate(var(--rot)); opacity: 1; }
                  100% { transform: translate(-50%, -50%) scale(1.1) rotate(var(--rot)); opacity: 0; }
              }
              @keyframes comic-slide {
                  0% { transform: translate(-150%, -50%) rotate(var(--rot)); opacity: 0; }
                  40% { transform: translate(-50%, -50%) rotate(var(--rot)); opacity: 1; }
                  80% { transform: translate(-50%, -50%) scale(1.1) rotate(var(--rot)); opacity: 1; }
                  100% { transform: translate(150%, -50%) rotate(var(--rot)); opacity: 0; }
              }
              @keyframes comic-shake {
                  0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                  20% { transform: translate(-52%, -48%) scale(1.1); opacity: 1; }
                  40% { transform: translate(-48%, -52%) scale(1.1); }
                  60% { transform: translate(-52%, -48%) scale(1.1); }
                  80% { transform: translate(-48%, -52%) scale(1.1); opacity: 1; }
                  100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
              }
              .halftone-bg {
                  background-image: radial-gradient(#d1d5db 20%, transparent 20%);
                  background-size: 16px 16px;
              }
            `}</style>
            
            {/* Dynamic Backgrounds */}
            <div className="absolute inset-0 halftone-bg opacity-40 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/30 to-blue-50/30 mix-blend-multiply pointer-events-none" />

            {particles.map(p => (
                <div key={p.id} 
                     className="absolute z-10 flex items-center justify-center pointer-events-none"
                     style={{ 
                         left: p.x, 
                         top: p.y, 
                         '--rot': `${p.rot}deg`, 
                         animation: `${p.anim} 1.5s forwards ease-out` 
                     } as React.CSSProperties}>
                    
                    {/* Background Shape */}
                    {p.shape === 'star' && (
                        <div className={`absolute w-40 h-40 ${p.shapeColor} opacity-90`}
                             style={{ 
                                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                                transform: `scale(${p.scale})`
                             }} />
                    )}
                    {p.shape === 'circle' && (
                         <div className={`absolute w-36 h-36 rounded-full ${p.shapeColor} border-4 border-black opacity-90`}
                             style={{ transform: `scale(${p.scale})` }} />
                    )}
                    {p.shape === 'burst' && (
                         <div className={`absolute w-44 h-44 ${p.shapeColor} opacity-90`}
                              style={{ 
                                clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)', // Octagon-ish blast
                                transform: `scale(${p.scale}) rotate(45deg)`
                              }} />
                    )}

                    {/* Text Layer */}
                    <div className="relative z-10" style={{ transform: `scale(${p.scale})` }}>
                        {/* Stroke/Shadow copy */}
                        <span className="absolute top-1 left-1 font-comic text-6xl font-black text-black select-none whitespace-nowrap opacity-100">
                            {p.text}
                        </span>
                        {/* Main text */}
                        <span className={`relative font-comic text-6xl font-black ${p.textColor} select-none whitespace-nowrap drop-shadow-[2px_2px_0px_white]`}>
                            {p.text}
                        </span>
                    </div>
                </div>
            ))}

            {/* Static Loading Indicator */}
            <div className="absolute bottom-16 inset-x-0 text-center z-20">
                <div className="inline-block bg-white/90 px-6 py-2 border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.8)] -rotate-2">
                    <p className="font-comic text-2xl text-black tracking-widest animate-pulse">
                        INKING PAGE...
                    </p>
                </div>
            </div>
        </div>
    );
};
