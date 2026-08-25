'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Music2, VolumeX, Volume1 } from 'lucide-react';

// ─── Chord Progressions ─────────────────────────────────────────────────────
// C Natural Minor atmosphere — detective / mystery / study vibe
const CHORDS = [
  [130.81, 155.56, 196.00],  // Cm  — root chord
  [174.61, 207.65, 261.63],  // Fm  — subdominant
  [146.83, 174.61, 220.00],  // Gm  — dominant
  [116.54, 138.59, 174.61],  // Bbm — tension
  [130.81, 155.56, 196.00],  // Cm  — back to root
  [233.08, 277.18, 349.23],  // Cm7 — colour chord
];

// ─── Utility: Create Reverb from impulse ─────────────────────────────────────
function createReverb(ctx: AudioContext): ConvolverNode {
  const convolver = ctx.createConvolver();
  const length = ctx.sampleRate * 2.5;
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
    }
  }
  convolver.buffer = buffer;
  return convolver;
}

// ─── Utility: Create Delay ────────────────────────────────────────────────────
function createDelay(ctx: AudioContext, time = 0.35, feedback = 0.3): [DelayNode, GainNode] {
  const delay = ctx.createDelay(2);
  delay.delayTime.value = time;
  const fb = ctx.createGain();
  fb.gain.value = feedback;
  delay.connect(fb);
  fb.connect(delay);
  return [delay, fb];
}

export default function AmbientPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const reverbRef = useRef<ConvolverNode | null>(null);
  const delayRef = useRef<DelayNode | null>(null);
  const chordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chordIdxRef = useRef(0);
  const activeOscsRef = useRef<OscillatorNode[]>([]);

  // ── Play a chord pad ───────────────────────────────────────────────────────
  const playChord = useCallback((ctx: AudioContext, master: GainNode, reverb: ConvolverNode, delay: DelayNode) => {
    const freqs = CHORDS[chordIdxRef.current % CHORDS.length];
    chordIdxRef.current++;

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? 'sine' : i === 1 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Slight detune for warmth
      osc.detune.setValueAtTime((Math.random() - 0.5) * 8, ctx.currentTime);

      // LFO for tremolo
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.15 + Math.random() * 0.1;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.015;
      lfo.connect(lfoGain);

      const gain = ctx.createGain();
      // ADSR envelope
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04 - i * 0.008, now + 1.8);  // attack
      gain.gain.setValueAtTime(0.035 - i * 0.006, now + 5);             // sustain
      gain.gain.linearRampToValueAtTime(0, now + 8.5);                   // release

      lfoGain.connect(gain.gain);

      osc.connect(gain);
      gain.connect(reverb);
      gain.connect(delay);
      gain.connect(master);

      osc.start(now);
      osc.stop(now + 9);
      lfo.start(now);
      lfo.stop(now + 9);

      activeOscsRef.current.push(osc);
    });

    // Bass note (two octaves down)
    const bassOsc = ctx.createOscillator();
    bassOsc.type = 'sine';
    bassOsc.frequency.value = freqs[0] / 2;
    const bassGain = ctx.createGain();
    const now = ctx.currentTime;
    bassGain.gain.setValueAtTime(0, now);
    bassGain.gain.linearRampToValueAtTime(0.06, now + 2);
    bassGain.gain.linearRampToValueAtTime(0, now + 8.5);
    bassOsc.connect(bassGain);
    bassGain.connect(master);
    bassOsc.start(now);
    bassOsc.stop(now + 9);
    activeOscsRef.current.push(bassOsc);
  }, []);

  // ── Subtle hi-hat tick ─────────────────────────────────────────────────────
  const playTick = useCallback((ctx: AudioContext, master: GainNode) => {
    const bufLen = ctx.sampleRate * 0.04;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.15));
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;

    // High-pass filter to make it tick-like
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 6000;

    const tickGain = ctx.createGain();
    tickGain.gain.value = 0.018;

    src.connect(hpf);
    hpf.connect(tickGain);
    tickGain.connect(master);
    src.start(ctx.currentTime);
  }, []);

  // ── Start audio engine ─────────────────────────────────────────────────────
  const startAudio = useCallback(() => {
    const ctx = new AudioContext();
    ctxRef.current = ctx;

    // Master gain (very quiet, atmospheric)
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    masterGainRef.current = master;

    // Fade in slowly
    master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 3);

    // Reverb
    const reverb = createReverb(ctx);
    const reverbGain = ctx.createGain();
    reverbGain.gain.value = 0.4;
    reverb.connect(reverbGain);
    reverbGain.connect(master);
    reverbRef.current = reverb;

    // Delay
    const [delay] = createDelay(ctx, 0.4, 0.28);
    const delayGain = ctx.createGain();
    delayGain.gain.value = 0.18;
    delay.connect(delayGain);
    delayGain.connect(master);
    delayRef.current = delay;

    // First chord
    playChord(ctx, master, reverb, delay);

    // Schedule subsequent chords every 8 seconds
    const scheduleNext = () => {
      playChord(ctx, master, reverb, delay);
      chordTimerRef.current = setTimeout(scheduleNext, 8000);
    };
    chordTimerRef.current = setTimeout(scheduleNext, 8000);

    // Hi-hat tick every beat (at ~72bpm = ~833ms)
    let beat = 0;
    tickTimerRef.current = setInterval(() => {
      beat++;
      // Accent on beats 1 and 3 (every 4th = kick feel), soft on 2 and 4
      if (beat % 2 === 0) playTick(ctx, master);
    }, 833);
  }, [playChord, playTick]);

  // ── Stop audio engine ──────────────────────────────────────────────────────
  const stopAudio = useCallback(() => {
    if (masterGainRef.current && ctxRef.current) {
      masterGainRef.current.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 1.5);
    }
    if (chordTimerRef.current) clearTimeout(chordTimerRef.current);
    if (tickTimerRef.current) clearInterval(tickTimerRef.current);

    const ctxToClose = ctxRef.current;
    setTimeout(() => {
      activeOscsRef.current.forEach(osc => {
        try { osc.stop(); } catch(e) {}
      });
      if (ctxToClose && ctxToClose.state !== 'closed') {
        ctxToClose.close();
      }
      activeOscsRef.current = [];
    }, 1800);
  }, []);

  const toggle = useCallback(() => {
    setHasInteracted(true);
    if (isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      startAudio();
      setIsPlaying(true);
    }
  }, [isPlaying, startAudio, stopAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chordTimerRef.current) clearTimeout(chordTimerRef.current);
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
      if (ctxRef.current) ctxRef.current.close();
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Tooltip */}
      {!hasInteracted && (
        <div className="px-3 py-1.5 rounded-2xl bg-slate-800/90 text-white text-[10px] font-bold backdrop-blur-sm animate-bounce">
          🎵 เปิดเพลง Ambient
        </div>
      )}

      {/* Music Button */}
      <button
        onClick={toggle}
        title={isPlaying ? 'ปิดเพลง' : 'เปิดเพลง Ambient'}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-soft-lg border-b-4 transition-all duration-300 ${
          isPlaying
            ? 'bg-primary text-white border-purple-900 scale-95'
            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
        }`}
      >
        {isPlaying ? (
          <Volume1 className="w-5 h-5 animate-pulse" />
        ) : (
          <Music2 className="w-5 h-5" />
        )}
      </button>

      {/* Visualizer bars when playing */}
      {isPlaying && (
        <div className="flex items-end gap-0.5 h-4 opacity-70">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-primary rounded-full"
              style={{
                height: `${40 + i * 10}%`,
                animation: `equalize ${0.6 + i * 0.15}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes equalize {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
