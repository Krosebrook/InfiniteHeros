
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
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    public toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    public play(type: 'click' | 'flip' | 'pop' | 'success') {
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
    }
}

export const soundManager = new SoundManager();
