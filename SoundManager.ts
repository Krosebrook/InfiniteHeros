
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Simple synthesizer for UI sounds to avoid external asset dependencies
class SoundManager {
    private ctx: AudioContext | null = null;
    private isMuted: boolean = false;

    private init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
    }

    public toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    private base64ToArrayBuffer(base64: string): ArrayBuffer {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    public async playTTS(base64Data: string, speed: number = 1.0) {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;
        
        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }

        try {
            const arrayBuffer = this.base64ToArrayBuffer(base64Data);
            const dataInt16 = new Int16Array(arrayBuffer);
            const numChannels = 1;
            const sampleRate = 24000;
            
            // Convert Int16 PCM to Float32 for Web Audio API
            const frameCount = dataInt16.length / numChannels;
            const audioBuffer = this.ctx.createBuffer(numChannels, frameCount, sampleRate);
            
            for (let channel = 0; channel < numChannels; channel++) {
                const channelData = audioBuffer.getChannelData(channel);
                for (let i = 0; i < frameCount; i++) {
                    // Convert 16-bit integer to float range [-1.0, 1.0]
                    channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
                }
            }

            const source = this.ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.playbackRate.value = speed; 
            source.connect(this.ctx.destination);
            source.start();
        } catch (e) {
            console.error("Error playing TTS", e);
        }
    }

    public play(type: 'click' | 'flip' | 'pop' | 'success' | 'scribble' | 'swoosh' | 'magic') {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        // Resume context if suspended (browser policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        if (type === 'click') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(400, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            osc.start(t);
            osc.stop(t + 0.1);
        } 
        else if (type === 'flip') {
            // White noise burst for paper sound
            const bufferSize = this.ctx.sampleRate * 0.3; // 300ms
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            
            // Lowpass filter to make it sound like paper
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, t);

            noise.connect(filter);
            filter.connect(gain);
            
            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            noise.start(t);
        }
        else if (type === 'pop') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.linearRampToValueAtTime(600, t + 0.1);
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            osc.start(t);
            osc.stop(t + 0.3);
        }
        else if (type === 'success') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, t);
            osc.frequency.setValueAtTime(554, t + 0.1); // C#
            osc.frequency.setValueAtTime(659, t + 0.2); // E
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.6);
            osc.start(t);
            osc.stop(t + 0.6);
        }
        else if (type === 'scribble') {
            // High frequency scratch sound
            const bufferSize = this.ctx.sampleRate * 0.15;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(4000, t);
            filter.Q.setValueAtTime(5, t);

            noise.connect(filter);
            filter.connect(gain);
            
            gain.gain.setValueAtTime(0.05, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            noise.start(t);
        }
        else if (type === 'swoosh') {
            // Filtered noise sweep for motion
            const bufferSize = this.ctx.sampleRate * 0.5;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.Q.value = 1;
            filter.frequency.setValueAtTime(200, t);
            filter.frequency.exponentialRampToValueAtTime(3000, t + 0.2);

            noise.connect(filter);
            filter.connect(gain);

            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.15, t + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            
            noise.start(t);
        }
        else if (type === 'magic') {
            // Sparkly chord for AI generation
            const freqs = [523.25, 659.25, 783.99, 1046.50]; // C Major 7
            freqs.forEach((f, i) => {
                const o = this.ctx!.createOscillator();
                const g = this.ctx!.createGain();
                o.type = 'sine';
                o.frequency.value = f;
                o.connect(g);
                g.connect(this.ctx!.destination);
                
                const start = t + (i * 0.05);
                g.gain.setValueAtTime(0, start);
                g.gain.linearRampToValueAtTime(0.05, start + 0.05);
                g.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
                
                o.start(start);
                o.stop(start + 1);
            });
        }
    }
}

export const soundManager = new SoundManager();
