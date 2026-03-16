
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { Persona } from './types';
import { soundManager } from './SoundManager';
import { t } from './translations';

interface ChatMessage {
    sender: 'user' | 'character';
    text: string;
}

interface CharacterChatDialogProps {
    persona: Persona;
    role: string;
    onSendMessage: (msg: string) => Promise<string>;
    onReadAloud: (text: string, voice: string) => Promise<void>;
    onClose: () => void;
    lang: string;
}

export const CharacterChatDialog: React.FC<CharacterChatDialogProps> = ({ persona, role, onSendMessage, onReadAloud, onClose, lang }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;
        
        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
        setIsTyping(true);
        soundManager.play('scribble');

        try {
            const reply = await onSendMessage(userMsg);
            setMessages(prev => [...prev, { sender: 'character', text: reply }]);
            
            // Auto-read reply if possible
            let voiceName = 'Zephyr';
            if (role.toLowerCase().includes('villain')) voiceName = 'Charon';
            else if (role.toLowerCase().includes('hero')) voiceName = 'Fenrir';
            else if (role.toLowerCase().includes('ally') || role.toLowerCase().includes('friend')) voiceName = 'Puck';
            
            onReadAloud(reply, voiceName);
        } catch (e) {
            setMessages(prev => [...prev, { sender: 'character', text: t(lang, "ERROR_MENTAL_LINK") }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[600] flex items-center justify-center p-2 md:p-4 bg-black/90 animate-in fade-in duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-title"
        >
             <div className="w-full max-w-2xl bg-white border-[6px] md:border-[8px] border-black flex flex-col h-full max-h-[90vh] md:h-[600px] shadow-[12px_12px_0px_rgba(255,255,255,1)] md:shadow-[20px_20px_0px_rgba(255,255,255,1)] relative overflow-hidden transform -rotate-1">
                
                {/* Header */}
                <header className="bg-yellow-400 p-3 md:p-4 border-b-[6px] border-black flex items-center gap-3 md:gap-4 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2.5px)', backgroundSize: '10px 10px' }}></div>
                    <div className="relative z-10 w-16 h-16 md:w-20 md:h-20 border-4 border-black rounded-full overflow-hidden shadow-[4px_4px_0px_rgba(0,0,0,1)] bg-white transform rotate-3">
                        <img src={`data:image/jpeg;base64,${persona.base64}`} className="w-full h-full object-cover" alt={`Avatar of ${persona.name}`}/>
                    </div>
                    <div className="flex-1 min-w-0 relative z-10">
                         <h2 id="chat-title" className="font-comic text-3xl md:text-4xl text-black leading-none truncate uppercase drop-shadow-[2px_2px_0_white] transform -skew-x-6">{persona.name || t(lang, "UNKNOWN")}</h2>
                         <p className="font-sans font-bold text-[10px] md:text-xs text-black uppercase tracking-widest truncate bg-white inline-block px-2 border-2 border-black mt-1 shadow-[2px_2px_0px_rgba(0,0,0,1)]">{role} // {t(lang, "ESTABLISHED_LINK")}</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="relative z-10 bg-red-500 text-white px-4 md:px-5 py-2 font-comic text-xl md:text-2xl border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-red-400 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] transition-all active:scale-95 transform rotate-2"
                        aria-label="Close Communication Link"
                    >{t(lang, "CLOSE")}</button>
                </header>

                {/* Messages Area */}
                <div 
                    ref={scrollRef} 
                    className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-gray-100 relative"
                    aria-live="polite"
                    aria-label="Chat messages"
                >
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2.5px)', backgroundSize: '15px 15px' }}></div>
                    
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-60 relative z-10" aria-hidden="true">
                            <span className="text-6xl mb-4 drop-shadow-[4px_4px_0_rgba(0,0,0,0.2)]">📡</span>
                            <p className="font-comic text-2xl text-black bg-white p-4 border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] transform -rotate-2">{t(lang, "CONNECTION_STABLE")}<br/>{t(lang, "ASK_ME_ANYTHING")}</p>
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'} relative z-10`}>
                            <div 
                                className={`max-w-[85%] md:max-w-[75%] p-3 md:p-4 font-comic text-base md:text-lg leading-snug relative group ${
                                    m.sender === 'user' 
                                        ? 'bg-blue-100 border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] rounded-2xl rounded-tr-none transform rotate-1' 
                                        : 'bg-white border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] rounded-2xl rounded-tl-none transform -rotate-1'
                                }`}
                                aria-label={`${m.sender === 'user' ? 'You' : persona.name} said: ${m.text}`}
                            >
                                {m.text}
                                {/* Comic Bubble Tails */}
                                {m.sender === 'user' ? (
                                    <div className="absolute top-0 -right-4 w-4 h-6 bg-blue-100 border-r-4 border-t-4 border-black transform skew-y-[30deg] origin-top-left -z-10"></div>
                                ) : (
                                    <div className="absolute top-0 -left-4 w-4 h-6 bg-white border-l-4 border-t-4 border-black transform -skew-y-[30deg] origin-top-right -z-10"></div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start relative z-10" aria-live="assertive" aria-label={`${persona.name} is typing...`}>
                             <div className="bg-white border-4 border-black shadow-[6px_6px_0px_rgba(0,0,0,1)] rounded-2xl rounded-tl-none p-4 flex items-center gap-2 transform -rotate-1">
                                 <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                 <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                 <div className="w-3 h-3 bg-black rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                                 <div className="absolute top-0 -left-4 w-4 h-6 bg-white border-l-4 border-t-4 border-black transform -skew-y-[30deg] origin-top-right -z-10"></div>
                             </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-3 md:p-4 bg-white border-t-[6px] border-black relative z-10">
                    <div className="flex gap-2 md:gap-3">
                        <input 
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            className="flex-1 bg-gray-100 border-4 border-black p-3 md:p-4 font-comic text-lg md:text-xl text-black focus:outline-none focus:bg-yellow-50 focus:shadow-[inset_4px_4px_0px_rgba(0,0,0,0.1)] transition-colors placeholder-gray-500"
                            placeholder={t(lang, "INTERROGATE_PLACEHOLDER")}
                            aria-label="Message input"
                        />
                        <button 
                            onClick={handleSend} 
                            disabled={isTyping || !input.trim()}
                            className="bg-blue-500 text-white px-6 md:px-8 py-3 md:py-4 font-comic text-xl md:text-2xl border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:bg-blue-400 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:translate-x-0 disabled:hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all active:scale-95"
                            aria-label="Send message"
                        >
                            {t(lang, "SEND")}
                        </button>
                    </div>
                </div>

                {/* Overlay FX */}
                <div className="absolute inset-0 pointer-events-none border-[10px] md:border-[20px] border-yellow-400/5 mix-blend-overlay" aria-hidden="true" />
             </div>
        </div>
    );
};
