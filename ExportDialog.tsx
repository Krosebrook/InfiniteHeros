
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface ExportDialogProps {
    onClose: () => void;
    onExport: (format: 'png' | 'jpg' | 'pdf', quality: number, scale: number) => void;
    isExporting: boolean;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ onClose, onExport, isExporting }) => {
    const [format, setFormat] = useState<'png' | 'jpg' | 'pdf'>('pdf');
    const [quality, setQuality] = useState(0.9);
    const [scale, setScale] = useState(1);

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/80 p-4">
             <div className="bg-white border-4 border-black p-6 max-w-sm w-full shadow-[10px_10px_0px_white] animate-in fade-in zoom-in duration-300">
                <h2 className="font-comic text-3xl mb-4 border-b-4 border-black pb-2">EXPORT COMIC</h2>
                
                <div className="mb-4">
                    <label className="block font-bold mb-1 font-comic text-lg">Format</label>
                    <div className="flex gap-2">
                        <button onClick={() => setFormat('pdf')} className={`flex-1 py-2 border-2 border-black font-bold font-comic text-lg transition-colors ${format==='pdf' ? 'bg-red-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>PDF</button>
                        <button onClick={() => setFormat('png')} className={`flex-1 py-2 border-2 border-black font-bold font-comic text-lg transition-colors ${format==='png' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>PNG</button>
                        <button onClick={() => setFormat('jpg')} className={`flex-1 py-2 border-2 border-black font-bold font-comic text-lg transition-colors ${format==='jpg' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>JPG</button>
                    </div>
                </div>

                <div className="mb-4">
                     <label className="block font-bold mb-1 font-comic text-lg">Size</label>
                     <select value={scale} onChange={e => setScale(parseFloat(e.target.value))} className="w-full border-2 border-black p-2 font-comic text-lg bg-white">
                         <option value={1}>Original (100%)</option>
                         <option value={0.75}>Medium (75%)</option>
                         <option value={0.5}>Web Friendly (50%)</option>
                     </select>
                </div>

                <div className="flex gap-2 mt-6">
                    <button onClick={onClose} disabled={isExporting} className="flex-1 py-3 border-2 border-black font-bold hover:bg-gray-200 font-comic text-xl">CANCEL</button>
                    <button onClick={() => onExport(format, quality, scale)} disabled={isExporting} className="flex-1 py-3 border-2 border-black bg-yellow-400 font-bold hover:bg-yellow-300 font-comic text-xl">
                        {isExporting ? 'EXPORTING...' : 'DOWNLOAD'}
                    </button>
                </div>
             </div>
        </div>
    )
}
