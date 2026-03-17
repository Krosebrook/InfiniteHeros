
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import { soundManager } from './SoundManager';
import { t } from './translations';

interface DiceRollerProps {
    onComplete: (value: number) => void;
    lang: string;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({ onComplete, lang }) => {
    const [value, setValue] = useState(20);
    const [isRolling, setIsRolling] = useState(true);

    useEffect(() => {
        soundManager.play('swoosh');
        let rolls = 0;
        const maxRolls = 20;
        const interval = setInterval(() => {
            setValue(Math.ceil(Math.random() * 20));
            rolls++;
            if (rolls > maxRolls) {
                clearInterval(interval);
                const final = Math.ceil(Math.random() * 20);
                setValue(final);
                setIsRolling(false);
                soundManager.play('pop');
                setTimeout(() => onComplete(final), 1000);
            }
        }, 80);
        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div 
            className="fixed inset-0 z-[700] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            role="alert"
            aria-live="assertive"
            aria-label={isRolling ? "Rolling dice..." : `Dice result: ${value}. ${value >= 10 ? 'Success' : 'Failure'}`}
        >
            <div className={`transform transition-all duration-300 ${isRolling ? 'animate-bounce' : 'scale-[1.8] rotate-[-5deg]'}`}>
                {/* SVG D20 Icon */}
                <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className={`w-full h-full drop-shadow-[8px_8px_0px_rgba(255,255,255,1)] ${isRolling ? 'animate-spin' : ''}`} style={{animationDuration: '0.3s'}} aria-hidden="true">
                        <path d="M50 5 L93 25 L93 75 L50 95 L7 75 L7 25 Z" fill="#EF4444" stroke="black" strokeWidth="4" />
                        <path d="M50 5 L50 95 M7 25 L93 25 M7 75 L93 75 L50 50 L7 25" stroke="black" strokeWidth="3" fill="none" opacity="0.5" />
                        <path d="M50 5 L93 25 L50 50 Z" fill="#FCA5A5" opacity="0.4" />
                        <path d="M7 25 L50 5 L50 50 Z" fill="#991B1B" opacity="0.4" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-comic text-6xl font-black text-white drop-shadow-[4px_4px_0px_black]">{value}</span>
                    </div>
                </div>
                {!isRolling && (
                    <div className="text-center mt-8 absolute left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
                        <span className={`inline-block px-6 py-3 border-[6px] border-black font-comic text-4xl font-black shadow-[8px_8px_0px_rgba(0,0,0,1)] transform ${value >= 10 ? 'bg-green-400 text-black rotate-3' : 'bg-red-500 text-white -rotate-3'}`}>
                            {value >= 10 ? t(lang, "SUCCESS") : t(lang, "FAILURE")}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
