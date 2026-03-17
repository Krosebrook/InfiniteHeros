
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { t } from './translations';

interface ExportDialogProps {
    onClose: () => void;
    onExport: (format: 'png' | 'jpg' | 'pdf', quality: number, scale: number) => void;
    isExporting: boolean;
    lang: string;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ onClose, onExport, isExporting, lang }) => {
    const [format, setFormat] = useState<'png' | 'jpg' | 'pdf'>('pdf');
    const [quality, setQuality] = useState(0.9);
    const [scale, setScale] = useState(1);

    return (
        <div 
            className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 p-2 md:p-4 animate-in fade-in duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-title"
        >
             <div className="bg-white border-[6px] md:border-[8px] border-black p-6 md:p-8 max-w-md w-full shadow-[12px_12px_0px_rgba(255,255,255,1)] md:shadow-[20px_20px_0px_rgba(255,255,255,1)] animate-in zoom-in duration-300 relative overflow-hidden transform rotate-1">
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2.5px)', backgroundSize: '10px 10px' }}></div>
                
                <h2 id="export-title" className="font-comic text-4xl md:text-5xl mb-6 border-b-[6px] border-black pb-4 uppercase tracking-tighter text-center bg-yellow-400 p-2 transform -skew-x-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] relative z-10">{t(lang, "EXPORT_COMIC")}</h2>
                
                <div className="mb-6 relative z-10">
                    <label className="block font-bold mb-2 font-comic text-2xl uppercase tracking-tight bg-black text-white inline-block px-3 py-1 transform -rotate-2 shadow-[4px_4px_0px_rgba(255,255,255,1)]">{t(lang, "FORMAT")}</label>
                    <div className="flex gap-3 mt-2" role="group" aria-label="Export Format Selection">
                        <button 
                            onClick={() => setFormat('pdf')} 
                            className={`flex-1 py-2 md:py-3 border-4 border-black font-bold font-comic text-xl md:text-2xl transition-all active:scale-95 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] ${format==='pdf' ? 'bg-red-500 text-white transform -rotate-2' : 'bg-gray-100 hover:bg-gray-200'}`}
                            aria-pressed={format === 'pdf'}
                        >PDF</button>
                        <button 
                            onClick={() => setFormat('png')} 
                            className={`flex-1 py-2 md:py-3 border-4 border-black font-bold font-comic text-xl md:text-2xl transition-all active:scale-95 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] ${format==='png' ? 'bg-blue-500 text-white transform rotate-2' : 'bg-gray-100 hover:bg-gray-200'}`}
                            aria-pressed={format === 'png'}
                        >PNG</button>
                        <button 
                            onClick={() => setFormat('jpg')} 
                            className={`flex-1 py-2 md:py-3 border-4 border-black font-bold font-comic text-xl md:text-2xl transition-all active:scale-95 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] ${format==='jpg' ? 'bg-green-500 text-white transform -rotate-1' : 'bg-gray-100 hover:bg-gray-200'}`}
                            aria-pressed={format === 'jpg'}
                        >JPG</button>
                    </div>
                </div>

                <div className="mb-8 relative z-10">
                     <label htmlFor="export-scale" className="block font-bold mb-2 font-comic text-2xl uppercase tracking-tight bg-black text-white inline-block px-3 py-1 transform rotate-1 shadow-[4px_4px_0px_rgba(255,255,255,1)]">{t(lang, "SIZE")}</label>
                     <div className="relative mt-2">
                         <select 
                            id="export-scale"
                            value={scale} 
                            onChange={e => setScale(parseFloat(e.target.value))} 
                            className="w-full border-4 border-black p-3 md:p-4 font-comic text-xl md:text-2xl bg-white text-black focus:ring-4 focus:ring-yellow-400 outline-none appearance-none shadow-[4px_4px_0px_rgba(0,0,0,1)] cursor-pointer"
                         >
                             <option value={1} className="text-black bg-white">{t(lang, "ORIGINAL_SIZE")}</option>
                             <option value={0.75} className="text-black bg-white">{t(lang, "MEDIUM_SIZE")}</option>
                             <option value={0.5} className="text-black bg-white">{t(lang, "WEB_FRIENDLY_SIZE")}</option>
                         </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-black">
                             <svg className="fill-current h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                         </div>
                     </div>
                </div>

                <div className="flex gap-3 mt-8 relative z-10">
                    <button 
                        onClick={onClose} 
                        disabled={isExporting} 
                        className="flex-1 py-3 md:py-4 border-4 border-black font-bold hover:bg-gray-200 font-comic text-xl md:text-2xl active:scale-95 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:translate-x-0 disabled:hover:shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                        aria-label="Cancel Export"
                    >{t(lang, "CANCEL")}</button>
                    <button 
                        onClick={() => onExport(format, quality, scale)} 
                        disabled={isExporting} 
                        className="flex-1 py-3 md:py-4 border-4 border-black bg-yellow-400 font-bold hover:bg-yellow-300 font-comic text-xl md:text-2xl active:scale-95 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:translate-x-0 disabled:hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transform rotate-1"
                        aria-label={isExporting ? "Exporting comic..." : "Download comic"}
                    >
                        {isExporting ? t(lang, "EXPORTING") : t(lang, "DOWNLOAD")}
                    </button>
                </div>
             </div>
        </div>
    )
}
