// 사운드 파일 없이 Web Audio 로 효과음 합성
import { save, persist } from './storage';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

/** 첫 터치/키 입력 이후에 호출 (모바일 자동재생 제한 대응) */
export function unlockAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = save.muted ? 0 : 0.5;
      master.connect(ctx.destination);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    /* 오디오 미지원 */
  }
}

export function setMuted(m: boolean) {
  save.muted = m;
  persist();
  if (master) master.gain.value = m ? 0 : 0.5;
}

function tone(freq: number, to: number, dur: number, type: OscillatorType, vol: number, delay = 0) {
  if (!ctx || !master || save.muted) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(dur: number, vol: number, f0: number, f1: number, type: BiquadFilterType = 'lowpass') {
  if (!ctx || !master || !noiseBuf || save.muted) return;
  const t0 = ctx.currentTime;
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(f0, t0);
  f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f).connect(g).connect(master);
  s.start(t0);
  s.stop(t0 + dur + 0.02);
}

export const sfx = {
  jump: () => tone(380, 700, 0.09, 'square', 0.12),
  coin: () => {
    tone(988, 988, 0.08, 'square', 0.12);
    tone(1319, 1319, 0.16, 'square', 0.12, 0.07);
  },
  hit: () => {
    noise(0.28, 0.9, 1800, 120);
    tone(160, 40, 0.25, 'sawtooth', 0.25);
  },
  splash: () => {
    noise(0.5, 0.7, 3000, 300, 'bandpass');
    tone(500, 120, 0.3, 'sine', 0.15);
  },
  train: () => {
    noise(0.35, 1, 1200, 80);
    tone(120, 30, 0.35, 'sawtooth', 0.3);
  },
  bell: () => {
    tone(1500, 1500, 0.12, 'triangle', 0.1);
  },
  unlock: () => {
    tone(523, 523, 0.1, 'square', 0.12);
    tone(659, 659, 0.1, 'square', 0.12, 0.09);
    tone(784, 784, 0.2, 'square', 0.12, 0.18);
  },
  bump: () => tone(140, 90, 0.07, 'square', 0.1),
};
