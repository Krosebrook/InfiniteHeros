
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { soundManager } from './SoundManager';

const TEXT_FX = ["POW!", "BAM!", "ZAP!", "KRAK!", "SKREEE!", "WHOOSH!", "THWIP!", "BOOM!", "SPLORT!", "KA-POW!"];
const CHAT_FX = ["HMM...", "AHA!", "INKING...", "DRAWING...", "IDEATING...", "COLORING...", "MULTIVERSING..."];
const TEXT_COLORS = ['text-yellow-400', 'text-red-500', 'text-blue-400', 'text-orange-500', 'text-purple-500', 'text-green-500'];
const BG_COLORS = ['bg-yellow-400', 'bg-red-500', 'bg-blue-400', 'bg-orange-500', 'bg-purple-500', 'bg-green-500'];
const INK_COLORS = ['bg-black', 'bg-gray-900', 'bg-blue-900', 'bg-red-900'];

interface Particle {
    id: number;
    text: string;
    x: string;
    y: string;
    rot: number;
    scale: number;
    textColor: string;
    shape: 'star' | 'circle' | 'burst' | 'bubble' | 'none';
    shapeColor: string;
    anim: string;
}

interface InkSplat {
    id: number;
    x: string;
    y: string;
    size: number;
    borderRadius: string;
    color: string;
    rotation: number;
    isMeterSplat?: boolean;
    isDrip?: boolean;
}

interface LoadingFXProps {
    message?: string;
}

export const LoadingFX: React.FC<LoadingFXProps> = ({ message }) => {
    const [particles, setParticles] = useState<Particle[]>([]);
    const [splats, setSplats] = useState<InkSplat[]>([]);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        soundManager.play('flip');

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 98) return prev;
                const increment = prev < 30 ? 3 : (prev < 70 ? 1.5 : (prev < 90 ? 0.8 : 0.2));
                return Math.min(prev + increment, 98);
            });
            if (Math.random() > 0.8) soundManager.play('scribble');
        }, 150);

        const effectInterval = setInterval(() => {
            const id = Date.now();
            
            // Varied Particles
            if (Math.random() > 0.3) {
                const isBubble = Math.random() > 0.7;
                const text = isBubble ? CHAT_FX[Math.floor(Math.random() * CHAT_FX.length)] : TEXT_FX[Math.floor(Math.random() * TEXT_FX.length)];
                const x = `${15 + Math.random() * 70}%`;
                const y = `${15 + Math.random() * 60}%`;
                const rot = Math.random() * 60 - 30;
                const scale = isBubble ? 0.5 + Math.random() * 0.4 : 0.7 + Math.random() * 0.8;
                const textColor = isBubble ? 'text-black' : TEXT_COLORS[Math.floor(Math.random() * TEXT_COLORS.length)];
                const shapeColor = isBubble ? 'bg-white' : BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
                
                let shape: Particle['shape'] = 'none';
                if (isBubble) {
                    shape = 'bubble';
                } else {
                    const r = Math.random();
                    if (r < 0.33) shape = 'star';
                    else if (r < 0.66) shape = 'circle';
                    else shape = 'burst';
                }

                const anims = ['comic-pop', 'comic-slide', 'comic-shake'];
                const anim = anims[Math.floor(Math.random() * anims.length)];

                if (Math.random() > 0.6) soundManager.play('pop');

                setParticles(prev => {
                    const next = [...prev, { id, text, x, y, rot, scale, textColor, shape, shapeColor, anim }];
                    return next.slice(-8); 
                });
            }

            // General Background Splats
            if (Math.random() > 0.4) {
                 const isDrip = Math.random() > 0.7;
                 const splatId = Date.now() + Math.random();
                 const splatX = `${Math.random() * 100}%`;
                 const splatY = isDrip ? `-10%` : `${Math.random() * 100}%`;
                 const size = isDrip ? 15 + Math.random() * 20 : 30 + Math.random() * 120;
                 const borderRadius = isDrip ? '20% 20% 80% 80%' : `${r(30,70)}% ${r(30,70)}% ${r(30,70)}% ${r(30,70)}% / ${r(30,70)}% ${r(30,70)}% ${r(30,70)}% ${r(30,70)}%`;
                 const color = INK_COLORS[Math.floor(Math.random() * INK_COLORS.length)];
                 const rotation = isDrip ? 0 : Math.random() * 360;
                 
                 setSplats(prev => {
                     const next = [...prev, { id: splatId, x: splatX, y: splatY, size, borderRadius, color, rotation, isDrip }];
                     return next.slice(-15);
                 });
            }
        }, 400); 
        
        return () => {
            clearInterval(effectInterval);
            clearInterval(progressInterval);
        };
    }, []);

    const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

    return (
        <div className="w-full h-full bg-[#fdfbf7] overflow-hidden relative border-r-4 border-gray-300">
            <style>{`
              @keyframes comic-pop {
                  0% { transform: translate(-50%, -50%) scale(0) rotate(var(--rot)); opacity: 0; }
                  50% { transform: translate(-50%, -50%) scale(1.3) rotate(var(--rot)); opacity: 1; }
                  100% { transform: translate(-50%, -50%) scale(1.1) rotate(var(--rot)); opacity: 0; }
              }
              @keyframes comic-slide {
                  0% { transform: translate(-150%, -50%) rotate(var(--rot)); opacity: 0; }
                  40% { transform: translate(-50%, -50%) rotate(var(--rot)); opacity: 1; }
                  100% { transform: translate(150%, -50%) rotate(var(--rot)); opacity: 0; }
              }
              @keyframes comic-shake {
                  0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                  20% { transform: translate(-52%, -48%) scale(1.1); opacity: 1; }
                  40% { transform: translate(-48%, -52%) scale(1.1); }
                  80% { transform: translate(-48%, -52%) scale(1.1); opacity: 1; }
                  100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
              }
              @keyframes splat-appear {
                  0% { transform: translate(-50%, -50%) scale(0.1) rotate(var(--rot)); opacity: 0.9; }
                  15% { transform: translate(-50%, -50%) scale(1.1) rotate(var(--rot)); opacity: 1; }
                  100% { transform: translate(-50%, -50%) scale(1.05) rotate(var(--rot)); opacity: 0; }
              }
              @keyframes ink-drip {
                  0% { transform: translateY(0); opacity: 1; height: 0px; }
                  100% { transform: translateY(110vh); opacity: 0.4; height: 100px; }
              }
              @keyframes scan-move {
                  0% { top: -5%; opacity: 0; }
                  10% { opacity: 1; }
                  90% { opacity: 1; }
                  100% { top: 105%; opacity: 0; }
              }
              @keyframes liquid-wobble {
                  0%, 100% { transform: translateY(0) scaleY(1); }
                  50% { transform: translateY(-3px) scaleY(1.05); }
              }
              .halftone-bg {
                  background-image: radial-gradient(#d1d5db 20%, transparent 20%);
                  background-size: 16px 16px;
              }
            `}</style>
            
            <div className="absolute inset-0 halftone-bg opacity-30 animate-pulse" />
            
            {splats.map(s => (
                <div key={s.id}
                     className={`absolute ${s.color} mix-blend-multiply z-10`}
                     style={{
                         left: s.x,
                         top: s.y,
                         width: s.size,
                         height: s.isDrip ? 'auto' : s.size,
                         borderRadius: s.borderRadius,
                         '--rot': `${s.rotation}deg`,
                         animation: s.isDrip ? 'ink-drip 4s linear forwards' : 'splat-appear 2s forwards ease-out'
                     } as React.CSSProperties}
                />
            ))}

            {/* Glowing Scan Line */}
            <div className="absolute left-0 right-0 h-4 bg-cyan-400/60 shadow-[0_0_25px_rgba(34,211,238,1)] z-20"
                 style={{ animation: 'scan-move 2.5s infinite linear' }} />
            
            {particles.map(p => (
                <div key={p.id} 
                     className="absolute z-30 flex items-center justify-center pointer-events-none"
                     style={{ 
                         left: p.x, 
                         top: p.y, 
                         '--rot': `${p.rot}deg`, 
                         animation: `${p.anim} 1.5s forwards ease-out` 
                     } as React.CSSProperties}>
                    
                    {p.shape === 'star' && (
                        <div className={`absolute w-40 h-40 ${p.shapeColor} opacity-90`}
                             style={{ 
                                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                                transform: `scale(${p.scale})`
                             }} />
                    )}
                    {p.shape === 'bubble' && (
                        <div className={`absolute w-48 h-24 ${p.shapeColor} border-4 border-black rounded-[50%] opacity-95 shadow-[4px_4px_0px_black]`}
                             style={{ transform: `scale(${p.scale})` }}>
                             <div className="absolute -bottom-4 left-1/4 w-8 h-8 bg-white border-l-4 border-b-4 border-black rotate-45" />
                        </div>
                    )}

                    <div className="relative z-10" style={{ transform: `scale(${p.scale})` }}>
                        <span className={`relative font-comic ${p.shape === 'bubble' ? 'text-2xl pt-2' : 'text-6xl'} font-black ${p.textColor} select-none whitespace-nowrap drop-shadow-[2px_2px_0px_white]`}>
                            {p.text}
                        </span>
                    </div>
                </div>
            ))}

            {/* Themed Gauge Section */}
            <div className="absolute bottom-16 inset-x-0 flex flex-col items-center z-40 gap-6">
                
                {/* Visual Inkwell Container */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                    <div className="absolute inset-0 border-[6px] border-black bg-white rounded-t-3xl rounded-b-lg shadow-[10px_10px_0px_rgba(0,0,0,0.2)] overflow-hidden">
                        <div 
                            className="absolute bottom-0 left-0 right-0 bg-black transition-all duration-500 ease-out animate-[liquid-wobble_3s_infinite]"
                            style={{ height: `${progress}%` }}
                        >
                            <div className="absolute top-0 left-0 right-0 h-4 bg-gray-700 opacity-40" />
                        </div>
                    </div>
                    {/* Bottle Cap */}
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-14 h-8 border-[6px] border-black bg-white rounded-sm z-10">
                         <div className="absolute top-0 inset-x-0 h-2 bg-gray-200" />
                    </div>
                    <span className="relative z-20 font-comic text-2xl text-yellow-400 font-bold mix-blend-difference">INK</span>
                </div>

                {/* Progress Meter */}
                <div className="w-full max-w-md px-12">
                    <div className="relative h-16 border-4 border-black bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)] rotate-[-1deg] overflow-hidden">
                        <div 
                            className="absolute top-0 bottom-0 left-0 bg-red-600 border-r-4 border-black transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-comic text-2xl text-black drop-shadow-[2px_2px_0px_white] tracking-widest font-bold">
                               {message ? message.toUpperCase() : 'PRODUCTION'}: {Math.floor(progress)}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="inline-block bg-white/95 px-8 py-3 border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] rotate-2">
                    <p className="font-comic text-2xl text-black tracking-widest animate-pulse">
                        COMMENCING INKING...
                    </p>
                </div>
            </div>
        </div>
    );
};
