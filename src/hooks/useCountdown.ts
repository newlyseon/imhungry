import { useState, useEffect } from 'react';

interface CountdownResult {
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isComplete: boolean;
  formatted: string;
}

export function useCountdown(targetTime: number | undefined): CountdownResult {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!targetTime) {
    return { hours: 0, minutes: 0, seconds: 0, totalMs: 0, isComplete: true, formatted: '00 : 00 : 00' };
  }

  const totalMs = Math.max(0, targetTime - now);
  const isComplete = totalMs <= 0;
  const totalSeconds = Math.floor(totalMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatted = `${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;

  return { hours, minutes, seconds, totalMs, isComplete, formatted };
}

export function useElapsed(startTime: number | undefined) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!startTime) return { elapsedMs: 0, elapsedHours: 0 };

  const elapsedMs = now - startTime;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  return { elapsedMs, elapsedHours };
}
