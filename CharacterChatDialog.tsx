
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { Persona } from './types';
import { soundManager } from './SoundManager';

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
}

export const CharacterChatDialog: React.FC<CharacterChatDialogProps> = ({ persona, role, onSendMessage, onReadAloud, onClose }) => {
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
            setMessages(prev => [...prev, { sender: 'character', text: "ERROR: Mental link severed. Try again later." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/90 animate-in fade-in duration-300">
             <div className="w-full max-w-2xl bg-[#111] border-[6px] border-yellow-400 flex flex-col h-[600px] shadow-[20px_20px_0px_rgba(0,0,0,0.5)] relative overflow-hidden">
                
                {/* Header */}
                <div className="bg-yellow-400 p-4 border-b-4 border-black flex items-center gap-4">
                    <img src={`data:image/jpeg;base64,${persona.base64}`} className="w-16 h-16 border-2 border-black rounded-full object-cover" alt="Avatar"/>
                    <div>
                         <h2 className="font-comic text-3xl text-black leading-none">{persona.name || "Unknown"}</h2>
                         <p className="font-mono text-[10px] text-black/60 uppercase tracking-widest">{role} // ESTABLISHED LINK</p>
                    </div>
                    <button onClick={onClose} className="ml-auto bg-black text-white px-4 py-1 font-comic text-lg hover:bg-gray-800 transition-colors">CLOSE</button>
                </div>

                {/* Messages Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]">
                    {messages.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                            <span className="text-4xl mb-2">📡</span>
                            <p className="font-comic text-xl text-white">CONNECTION STABLE.<br/>ASK ME ANYTHING.</p>
                        </div>
                    )}
                    {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-4 font-comic text-xl relative ${m.sender === 'user' ? 'bg-blue-600 text-white border-2 border-black rounded-l-2xl rounded-tr-2xl' : 'bg-white text-black border-2 border-black rounded-r-2xl rounded-tl-2xl'}`}>
                                {m.text}
                                <div className={`absolute top-0 w-4 h-4 border-t-2 border-black ${m.sender === 'user' ? 'left-full -ml-1 border-l-2 bg-blue-600' : 'right-full -mr-1 border-r-2 bg-white'}`} />
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white p-4 rounded-r-2xl rounded-tl-2xl border-2 border-black flex gap-1 items-center">
                                <div className="w-2 h-2 bg-black rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-2 h-2 bg-black rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-black border-t-4 border-yellow-400 flex gap-2">
                    <input 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        className="flex-1 bg-white border-2 border-black p-3 font-comic text-xl focus:outline-none placeholder:opacity-30"
                        placeholder="Interrogate or command..."
                    />
                    <button onClick={handleSend} className="bg-yellow-400 text-black px-8 py-2 font-comic text-2xl border-2 border-black hover:bg-yellow-300 transition-all active:scale-95 shadow-[4px_4px_0px_rgba(255,255,255,0.2)]">
                        SEND
                    </button>
                </div>

                {/* Overlay FX */}
                <div className="absolute inset-0 pointer-events-none border-[20px] border-yellow-400/5 mix-blend-overlay" />
             </div>
        </div>
    );
};
