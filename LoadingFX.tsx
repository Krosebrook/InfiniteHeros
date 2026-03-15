
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { soundManager } from './SoundManager';

const TEXT_FX = ["POW!", "BAM!", "ZAP!", "KRAK!", "SKREEE!", "WHOOSH!", "THWIP!", "BOOM!", "SPLORT!", "KA-POW!", "CRASH!", "WHAM!"];
const CHAT_FX = ["HMM...", "AHA!", "INKING...", "DRAWING...", "IDEATING...", "COLORING...", "MULTIVERSING...", "PLOTTING..."];
const TEXT_COLORS = ['text-yellow-400', 'text-red-500', 'text-blue-400', 'text-orange-500', 'text-purple-500', 'text-green-500', 'text-cyan-400', 'text-pink-500'];
const BG_COLORS = ['bg-yellow-400', 'bg-red-500', 'bg-blue-400', 'bg-orange-500', 'bg-purple-500', 'bg-green-500', 'bg-cyan-400', 'bg-pink-500'];
const INK_COLORS = ['bg-black', 'bg-gray-900', 'bg-blue-900', 'bg-red-900', 'bg-purple-900', 'bg-indigo-900'];

interface Particle {
    id: number;
    text: string;
    x: string;
    y: string;
    rot: number;
    scale: number;
    textColor: string;
    shape: 'star' | 'circle' | 'burst' | 'bubble' | 'lightning' | 'none';
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
                // Faster progress at the beginning, slowing down at the end
                const increment = prev < 30 ? 4 + Math.random() * 2 : (prev < 70 ? 2 + Math.random() * 2 : (prev < 90 ? 0.8 + Math.random() : 0.2));
                return Math.min(prev + increment, 98);
            });
            if (Math.random() > 0.7) soundManager.play('scribble');
        }, 150);

        return () => clearInterval(progressInterval);
    }, []);

    useEffect(() => {
        // Effect rate depends on progress (faster as it gets higher)
        const effectRate = Math.max(100, 400 - (progress * 3));

        const effectInterval = setInterval(() => {
            const id = Date.now();
            
            // Varied Particles
            if (Math.random() > 0.2) {
                const isBubble = Math.random() > 0.7;
                const text = isBubble ? CHAT_FX[Math.floor(Math.random() * CHAT_FX.length)] : TEXT_FX[Math.floor(Math.random() * TEXT_FX.length)];
                const x = `${10 + Math.random() * 80}%`;
                const y = `${10 + Math.random() * 70}%`;
                const rot = Math.random() * 80 - 40;
                const scale = isBubble ? 0.6 + Math.random() * 0.5 : 0.8 + Math.random() * 1.2;
                const textColor = isBubble ? 'text-black' : TEXT_COLORS[Math.floor(Math.random() * TEXT_COLORS.length)];
                const shapeColor = isBubble ? 'bg-white' : BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)];
                
                let shape: Particle['shape'] = 'none';
                if (isBubble) {
                    shape = 'bubble';
                } else {
                    const r = Math.random();
                    if (r < 0.25) shape = 'star';
                    else if (r < 0.5) shape = 'circle';
                    else if (r < 0.75) shape = 'burst';
                    else shape = 'lightning';
                }

                const anims = ['comic-pop', 'comic-slide', 'comic-shake', 'comic-zoom'];
                const anim = anims[Math.floor(Math.random() * anims.length)];

                if (Math.random() > 0.5) soundManager.play('pop');

                setParticles(prev => {
                    const next = [...prev, { id, text, x, y, rot, scale, textColor, shape, shapeColor, anim }];
                    return next.slice(-12); 
                });
            }

            // General Background Splats
            if (Math.random() > 0.3) {
                 const isDrip = Math.random() > 0.6;
                 const splatId = Date.now() + Math.random();
                 const splatX = `${Math.random() * 100}%`;
                 const splatY = isDrip ? `-10%` : `${Math.random() * 100}%`;
                 // Size increases with progress
                 const baseSize = progress > 50 ? 40 : 20;
                 const size = isDrip ? 15 + Math.random() * 30 : baseSize + Math.random() * (100 + progress);
                 const borderRadius = isDrip ? '20% 20% 80% 80%' : `${r(20,80)}% ${r(20,80)}% ${r(20,80)}% ${r(20,80)}% / ${r(20,80)}% ${r(20,80)}% ${r(20,80)}% ${r(20,80)}%`;
                 const color = INK_COLORS[Math.floor(Math.random() * INK_COLORS.length)];
                 const rotation = isDrip ? 0 : Math.random() * 360;
                 
                 setSplats(prev => {
                     const next = [...prev, { id: splatId, x: splatX, y: splatY, size, borderRadius, color, rotation, isDrip }];
                     return next.slice(-20);
                 });
            }
        }, effectRate); 
        
        return () => clearInterval(effectInterval);
    }, [progress]);

    const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

    const getStatusText = () => {
        if (progress < 30) return "SKETCHING...";
        if (progress < 60) return "INKING...";
        if (progress < 90) return "COLORING...";
        return "FINISHING TOUCHES...";
    };

    return (
        <div className="w-full h-full bg-[#fdfbf7] overflow-hidden relative border-r-4 border-gray-300">
            <style>{`
              @keyframes comic-pop {
                  0% { transform: translate(-50%, -50%) scale(0) rotate(var(--rot)); opacity: 0; }
                  30% { transform: translate(-50%, -50%) scale(1.4) rotate(var(--rot)); opacity: 1; }
                  50% { transform: translate(-50%, -50%) scale(1.2) rotate(var(--rot)); opacity: 1; }
                  100% { transform: translate(-50%, -50%) scale(1.1) rotate(var(--rot)); opacity: 0; }
              }
              @keyframes comic-slide {
                  0% { transform: translate(-150%, -50%) rotate(var(--rot)) scale(0.5); opacity: 0; }
                  40% { transform: translate(-50%, -50%) rotate(var(--rot)) scale(1.2); opacity: 1; }
                  60% { transform: translate(-50%, -50%) rotate(var(--rot)) scale(1); opacity: 1; }
                  100% { transform: translate(150%, -50%) rotate(var(--rot)) scale(0.5); opacity: 0; }
              }
              @keyframes comic-shake {
                  0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                  20% { transform: translate(-52%, -48%) scale(1.2); opacity: 1; }
                  40% { transform: translate(-48%, -52%) scale(1.2); }
                  60% { transform: translate(-52%, -48%) scale(1.2); }
                  80% { transform: translate(-48%, -52%) scale(1.2); opacity: 1; }
                  100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
              }
              @keyframes comic-zoom {
                  0% { transform: translate(-50%, -50%) scale(0) rotate(var(--rot)); opacity: 0; }
                  50% { transform: translate(-50%, -50%) scale(2) rotate(var(--rot)); opacity: 1; }
                  100% { transform: translate(-50%, -50%) scale(3) rotate(var(--rot)); opacity: 0; }
              }
              @keyframes splat-appear {
                  0% { transform: translate(-50%, -50%) scale(0.1) rotate(var(--rot)); opacity: 0.9; }
                  15% { transform: translate(-50%, -50%) scale(1.2) rotate(var(--rot)); opacity: 1; }
                  30% { transform: translate(-50%, -50%) scale(1.0) rotate(var(--rot)); opacity: 0.8; }
                  100% { transform: translate(-50%, -50%) scale(1.05) rotate(var(--rot)); opacity: 0; }
              }
              @keyframes ink-drip {
                  0% { transform: translateY(0); opacity: 1; height: 0px; }
                  100% { transform: translateY(120vh); opacity: 0.2; height: 150px; }
              }
              @keyframes scan-move {
                  0% { top: -10%; opacity: 0; }
                  10% { opacity: 1; }
                  90% { opacity: 1; }
                  100% { top: 110%; opacity: 0; }
              }
              @keyframes liquid-wobble {
                  0%, 100% { transform: translateY(0) scaleY(1); }
                  25% { transform: translateY(-4px) scaleY(1.08) rotate(-2deg); }
                  50% { transform: translateY(2px) scaleY(0.95) rotate(1deg); }
                  75% { transform: translateY(-2px) scaleY(1.04) rotate(-1deg); }
              }
              @keyframes meter-shake {
                  0%, 100% { transform: rotate(-1deg) translate(0, 0); }
                  25% { transform: rotate(-2deg) translate(-2px, 1px); }
                  50% { transform: rotate(0deg) translate(2px, -1px); }
                  75% { transform: rotate(-1.5deg) translate(-1px, -2px); }
              }
              @keyframes sparkle {
                  0% { opacity: 0; transform: scale(0) rotate(0deg); }
                  50% { opacity: 1; transform: scale(1.5) rotate(180deg); }
                  100% { opacity: 0; transform: scale(0) rotate(360deg); }
              }
              .halftone-bg {
                  background-image: radial-gradient(#d1d5db 20%, transparent 20%);
                  background-size: 16px 16px;
              }
            `}</style>
            
            <div className={`absolute inset-0 halftone-bg opacity-30 ${progress > 80 ? 'animate-ping' : 'animate-pulse'}`} style={{ animationDuration: progress > 80 ? '0.5s' : '2s' }} />
            
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
                         animation: s.isDrip ? 'ink-drip 3s linear forwards' : 'splat-appear 2.5s forwards ease-out'
                     } as React.CSSProperties}
                />
            ))}

            {/* Glowing Scan Line */}
            <div className="absolute left-0 right-0 h-6 bg-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,1)] z-20 mix-blend-screen"
                 style={{ animation: `scan-move ${Math.max(1, 3 - progress/30)}s infinite linear` }} />
            
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
                    {p.shape === 'lightning' && (
                        <div className={`absolute w-24 h-40 ${p.shapeColor} opacity-90`}
                             style={{ 
                                clipPath: 'polygon(50% 0%, 100% 0%, 60% 40%, 90% 40%, 30% 100%, 50% 50%, 10% 50%)',
                                transform: `scale(${p.scale})`
                             }} />
                    )}

                    <div className="relative z-10" style={{ transform: `scale(${p.scale})` }}>
                        <span className={`relative font-comic ${p.shape === 'bubble' ? 'text-2xl pt-2' : 'text-6xl'} font-black ${p.textColor} select-none whitespace-nowrap drop-shadow-[3px_3px_0px_black]`} style={{ WebkitTextStroke: '1px white' }}>
                            {p.text}
                        </span>
                    </div>
                </div>
            ))}

            {/* Themed Gauge Section */}
            <div className="absolute bottom-16 inset-x-0 flex flex-col items-center z-40 gap-6">
                
                {/* Visual Inkwell Container */}
                <div className="relative w-32 h-32 flex items-center justify-center">
                    <div className="absolute inset-0 border-[6px] border-black bg-white rounded-t-3xl rounded-b-lg shadow-[10px_10px_0px_rgba(0,0,0,0.3)] overflow-hidden">
                        <div 
                            className="absolute bottom-0 left-0 right-0 transition-all duration-300 ease-out animate-[liquid-wobble_2s_infinite]"
                            style={{ 
                                height: `${progress}%`,
                                backgroundColor: progress > 80 ? '#10b981' : (progress > 40 ? '#3b82f6' : '#111827')
                            }}
                        >
                            <div className="absolute top-0 left-0 right-0 h-4 bg-white opacity-30" />
                            {/* Bubbles in ink */}
                            {progress > 20 && (
                                <div className="absolute inset-0 overflow-hidden">
                                    <div className="absolute bottom-0 left-1/4 w-3 h-3 bg-white/40 rounded-full animate-[ink-drip_2s_infinite_reverse]" />
                                    <div className="absolute bottom-0 left-3/4 w-2 h-2 bg-white/40 rounded-full animate-[ink-drip_1.5s_infinite_reverse]" style={{ animationDelay: '0.5s' }} />
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Bottle Cap */}
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-14 h-8 border-[6px] border-black bg-white rounded-sm z-10">
                         <div className="absolute top-0 inset-x-0 h-2 bg-gray-300" />
                    </div>
                    <span className="relative z-20 font-comic text-2xl text-yellow-400 font-bold mix-blend-difference drop-shadow-[1px_1px_0px_black]">INK</span>
                </div>

                {/* Progress Meter */}
                <div className="w-full max-w-md px-12">
                    <div className="relative h-16 border-4 border-black bg-white shadow-[8px_8px_0px_rgba(0,0,0,1)] overflow-hidden"
                         style={{ animation: progress > 85 ? 'meter-shake 0.5s infinite' : 'none', transform: 'rotate(-1deg)' }}>
                        <div 
                            className="absolute top-0 bottom-0 left-0 border-r-4 border-black transition-all duration-200 ease-out flex items-center justify-end pr-2"
                            style={{ 
                                width: `${progress}%`,
                                backgroundColor: progress > 90 ? '#10b981' : (progress > 60 ? '#f59e0b' : '#ef4444')
                            }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
                            {/* Sparkle at the edge */}
                            <div className="w-6 h-6 bg-white rounded-full opacity-80 blur-sm animate-pulse" />
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center mix-blend-difference text-white">
                            <span className="font-comic text-2xl tracking-widest font-bold">
                               {message ? message.toUpperCase() : 'PRODUCTION'}: {Math.floor(progress)}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="inline-block bg-white/95 px-8 py-3 border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] rotate-2 transition-transform duration-300 hover:scale-110">
                    <p className="font-comic text-2xl text-black tracking-widest animate-pulse font-bold">
                        {getStatusText()}
                    </p>
                </div>
            </div>
        </div>
    );
};
