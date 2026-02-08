"use client";

import { useCallback, useRef, useEffect } from 'react';

export const useAudio = () => {
    const audioContextRef = useRef(null);

    const initAudio = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
    }, []);

    const playTone = useCallback((frequency, type, duration, volume = 0.1) => {
        if (!audioContextRef.current) initAudio();
        const ctx = audioContextRef.current;
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, ctx.currentTime);

        gainNode.gain.setValueAtTime(volume, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    }, [initAudio]);

    const playEatSound = useCallback(() => {
        playTone(600, 'square', 0.1, 0.1);
        setTimeout(() => playTone(800, 'square', 0.1, 0.1), 50);
    }, [playTone]);

    const playDieSound = useCallback(() => {
        playTone(200, 'sawtooth', 0.3, 0.2);
        setTimeout(() => playTone(150, 'sawtooth', 0.4, 0.2), 100);
    }, [playTone]);

    const playWinSound = useCallback(() => {
        playTone(400, 'sine', 0.1);
        setTimeout(() => playTone(500, 'sine', 0.1), 100);
        setTimeout(() => playTone(600, 'sine', 0.1), 200);
        setTimeout(() => playTone(800, 'square', 0.4), 300);
    }, [playTone]);

    const playMoveSound = useCallback(() => {
        // playTone(100, 'triangle', 0.05, 0.05); // Maybe too noisy
    }, [playTone]);

    return { initAudio, playEatSound, playDieSound, playWinSound, playMoveSound };
};
