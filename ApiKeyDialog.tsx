
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useApiKey } from './useApiKey';

export const ApiKeyDialog: React.FC = () => {
  const { validateApiKey } = useApiKey();
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleSelectKey = async () => {
    setError(null);
    setIsValidating(true);
    try {
      if (window.aistudio) {
        await window.aistudio.openSelectKey();
        const success = await validateApiKey();
        if (!success) {
          setError("Failed to validate the selected API key.");
        }
      } else {
        setError("AI Studio environment not detected.");
      }
    } catch (e) {
      setError("An error occurred while selecting the API key.");
      console.error(e);
    }
    setIsValidating(false);
  };

  return (
    <div 
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-md p-2 md:p-4 animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-key-title"
    >
      <div className="max-w-lg w-full bg-white border-[6px] md:border-[8px] border-black shadow-[12px_12px_0px_#DC2626] md:shadow-[20px_20px_0px_#DC2626] p-6 md:p-8 relative animate-in zoom-in duration-300 transform rotate-1 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2.5px)', backgroundSize: '10px 10px' }}></div>
        
        {/* Badge */}
        <div className="absolute -top-6 md:-top-8 left-1/2 -translate-x-1/2 bg-yellow-400 border-4 border-black px-6 md:px-8 py-2 md:py-3 rotate-[-3deg] shadow-[4px_4px_0px_rgba(0,0,0,1)] whitespace-nowrap z-10">
            <span className="font-comic text-xl md:text-3xl font-black uppercase tracking-widest">Secret Identity</span>
        </div>

        <h2 id="api-key-title" className="font-comic text-4xl md:text-6xl text-center mb-4 mt-6 md:mt-8 text-red-600 drop-shadow-[3px_3px_0px_black] uppercase transform -skew-x-6 relative z-10">API KEY REQUIRED</h2>
        
        <div className="relative z-10 space-y-6">
            <div className="bg-yellow-100 border-4 border-black p-4 transform rotate-1">
                <p className="font-comic text-lg md:text-xl font-bold mb-2">To access the multiverse, you need a key!</p>
                <p className="font-serif text-gray-800 text-sm md:text-base">
                    This app uses advanced Gemini models (including Veo for video). You must select a valid Gemini API key from a paid Google Cloud project.
                </p>
                <p className="font-serif text-gray-800 text-sm md:text-base mt-2">
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800 font-bold">
                        Learn more about billing requirements here.
                    </a>
                </p>
            </div>

            <div className="flex flex-col gap-4">
                <button 
                    onClick={handleSelectKey}
                    disabled={isValidating}
                    className="w-full bg-red-600 text-white font-comic text-2xl md:text-3xl py-3 md:py-4 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed transform -skew-x-3"
                >
                    {isValidating ? "VERIFYING..." : "SELECT API KEY"}
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 p-3 mt-4 transform -rotate-1">
                    <p className="text-red-700 font-bold font-comic">{error}</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
