
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useApiKey } from './useApiKey';

export const ApiKeyDialog: React.FC = () => {
  const { saveApiKey } = useApiKey();
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsValidating(true);

    if (!inputKey.trim()) {
        setError("Please enter a valid API key.");
        setIsValidating(false);
        return;
    }

    const success = await saveApiKey(inputKey.trim());
    if (!success) {
        setError("Invalid API Key or Quota Exceeded. Please check and try again.");
    }
    setIsValidating(false);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="max-w-lg w-full bg-white border-[6px] border-black shadow-[16px_16px_0px_#DC2626] p-8 relative animate-in zoom-in duration-300 transform rotate-1">
        
        {/* Badge */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-yellow-400 border-4 border-black px-6 py-2 rotate-[-2deg] shadow-lg">
            <span className="font-comic text-2xl font-bold uppercase tracking-widest">Secret Identity</span>
        </div>

        <h2 className="font-comic text-5xl text-center mb-2 mt-6 text-red-600 drop-shadow-[2px_2px_0px_black]">ENTER API KEY</h2>
        
        <p className="text-center text-gray-800 mb-6 font-sans text-lg leading-relaxed">
            To access the <span className="font-bold">Infinite Multiverse</span>, you need a paid Google Gemini API Key.
            <br/>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold hover:text-blue-800 bg-blue-50 px-1">Get your key here &rarr;</a>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="relative">
                <input 
                    type="password" 
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full border-4 border-black p-4 font-mono text-lg outline-none focus:bg-yellow-50 focus:border-blue-500 transition-colors shadow-inner"
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <span className="text-2xl">🔑</span>
                </div>
            </div>
            
            {error && (
                <div className="bg-red-100 border-l-8 border-red-600 p-3 text-red-700 font-bold animate-pulse flex items-center gap-2">
                    <span>⚠️</span> {error}
                </div>
            )}

            <button 
                type="submit" 
                disabled={isValidating}
                className={`comic-btn bg-black text-white text-2xl py-4 uppercase tracking-widest hover:bg-gray-800 transition-transform active:scale-95 shadow-[8px_8px_0px_rgba(0,0,0,0.5)] ${isValidating ? 'opacity-70 cursor-wait' : ''}`}
            >
                {isValidating ? 'AUTHENTICATING...' : 'UNLOCK SYSTEM'}
            </button>
        </form>

        <div className="mt-8 pt-4 border-t-2 border-dashed border-gray-300 text-center">
            <p className="text-xs text-gray-500 font-mono">
                Your key is stored securely in your browser's LocalStorage.<br/>We do not send it to any third-party servers.
            </p>
        </div>
      </div>
    </div>
  );
};
