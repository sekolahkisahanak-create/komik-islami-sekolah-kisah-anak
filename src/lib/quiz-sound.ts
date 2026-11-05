// Tiny built-in synthesized sounds (Web Audio) — no external files, royalty-free by construction.
const MUTE_KEY = "ska-quiz-muted";

export function getMuted() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MUTE_KEY) === "1";
}
export function saveMuted(v: boolean) {
  localStorage.setItem(MUTE_KEY, v ? "1" : "0");
}

export class QuizSound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicTimer: number | null = null;
  private muted = false;

  start(muted: boolean) {
    this.muted = muted;
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
    }
    void this.ctx.resume();
    this.master!.gain.value = muted ? 0 : 1;
    this.startMusic();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 1;
  }

  private tone(freq: number, at: number, dur: number, type: OscillatorType = "triangle", vol = 0.15) {
    if (!this.ctx || !this.master) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, at + dur);
    o.connect(g).connect(this.master);
    o.start(at);
    o.stop(at + dur + 0.05);
  }

  private startMusic() {
    if (this.musicTimer !== null || !this.ctx) return;
    // Cheerful pentatonic loop, 8 steps per bar
    const melody = [523, 659, 784, 659, 587, 784, 880, 784, 523, 587, 659, 523, 440, 523, 587, 0];
    const bass = [131, 131, 165, 165, 147, 147, 196, 196];
    let step = 0;
    const beat = 0.25;
    const tick = () => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + 0.05;
      const m = melody[step % melody.length];
      if (m) this.tone(m, t, beat * 0.9, "triangle", 0.05);
      if (step % 2 === 0) this.tone(bass[(step / 2) % bass.length] ?? 131, t, beat * 1.8, "sine", 0.06);
      step++;
    };
    this.musicTimer = window.setInterval(tick, beat * 1000);
  }

  stopMusic() {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  private now() {
    return this.ctx ? this.ctx.currentTime + 0.01 : 0;
  }
  correct() {
    const t = this.now();
    [659, 784, 1047].forEach((f, i) => this.tone(f, t + i * 0.08, 0.18, "square", 0.08));
  }
  wrong() {
    const t = this.now();
    this.tone(330, t, 0.2, "sine", 0.12);
    this.tone(262, t + 0.15, 0.3, "sine", 0.12);
  }
  streak() {
    const t = this.now();
    [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, t + 0.25 + i * 0.06, 0.12, "triangle", 0.08));
  }
  fanfare() {
    const t = this.now();
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, t + i * 0.14, i === 5 ? 0.7 : 0.16, "square", 0.08));
  }
  dispose() {
    this.stopMusic();
    void this.ctx?.close();
    this.ctx = null;
  }
}
