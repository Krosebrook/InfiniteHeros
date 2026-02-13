
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState } from 'react';
import { soundManager } from './SoundManager';

interface DiceRollerProps {
    onComplete: (value: number) => void;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({ onComplete }) => {
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
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className={`transform transition-all duration-300 ${isRolling ? 'animate-bounce' : 'scale-150'}`}>
                {/* SVG D20 Icon */}
                <div className="relative w-40 h-40">
                    <svg viewBox="0 0 100 100" className={`w-full h-full drop-shadow-[0_0_20px_rgba(255,215,0,0.5)] ${isRolling ? 'animate-spin' : ''}`} style={{animationDuration: '0.5s'}}>
                        <path d="M50 5 L93 25 L93 75 L50 95 L7 75 L7 25 Z" fill="#DC2626" stroke="black" strokeWidth="4" />
                        <path d="M50 5 L50 95 M7 25 L93 25 M7 75 L93 75 L50 50 L7 25" stroke="black" strokeWidth="2" fill="none" opacity="0.3" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-comic text-5xl font-bold text-white drop-shadow-[2px_2px_0px_black]">{value}</span>
                    </div>
                </div>
                {!isRolling && (
                    <div className="text-center mt-4">
                        <span className={`px-4 py-1 border-2 border-black font-comic text-xl font-bold ${value >= 10 ? 'bg-green-400 text-black' : 'bg-red-500 text-white'}`}>
                            {value >= 10 ? 'SUCCESS!' : 'FAILURE...'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
