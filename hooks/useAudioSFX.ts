"use client";

import { useCallback } from "react";

export function useAudioSFX(enabled: boolean = true) {
  const playTone = useCallback(
    (freq: number, type: OscillatorType, duration: number, gainVal: number = 0.1) => {
      if (!enabled || typeof window === "undefined") return;
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(gainVal, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch (e) {}
    },
    [enabled]
  );

  const playSuccess = useCallback(() => {
    playTone(523.25, "sine", 0.15, 0.12); // C5
    setTimeout(() => playTone(659.25, "sine", 0.15, 0.12), 100); // E5
    setTimeout(() => playTone(783.99, "sine", 0.3, 0.15), 200); // G5
  }, [playTone]);

  const playStart = useCallback(() => {
    playTone(440, "sine", 0.1, 0.08); // A4
    setTimeout(() => playTone(880, "sine", 0.2, 0.1), 100); // A5
  }, [playTone]);

  const playClick = useCallback(() => {
    playTone(600, "triangle", 0.04, 0.05);
  }, [playTone]);

  const playError = useCallback(() => {
    playTone(220, "sawtooth", 0.2, 0.1);
    setTimeout(() => playTone(180, "sawtooth", 0.25, 0.1), 150);
  }, [playTone]);

  return { playSuccess, playStart, playClick, playError };
}
