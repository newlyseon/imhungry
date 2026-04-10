import { useState, useEffect, useCallback } from 'react';

export type FastingType = '12:12' | '14:10' | '16:8' | '18:6' | 'custom';
export type AppPhase = 'home' | 'reserved' | 'eating' | 'fasting' | 'result';

export interface FastingStage {
  name: string;
  description: string;
  startHour: number;
}

export const FASTING_STAGES: FastingStage[] = [
  { name: '혈당 하락', description: '혈당이 안정되면서 몸이 차분해져요🩸', startHour: 0 },
  { name: '지방 연소 시작', description: '저장된 에너지를 다 쓰고, 지방을 쓰기 시작해요🔋', startHour: 4 },
  { name: '지방 연소 활성', description: '지방을 본격적으로 태우기 시작했어요🔥', startHour: 8 },
  { name: '오토파지 진입', description: '몸이 스스로 회복을 시작해요✨', startHour: 16 },
];

export interface FastingConfig {
  type: FastingType;
  fastingHours: number;
  eatingHours: number;
}

export const FASTING_PRESETS: Record<Exclude<FastingType, 'custom'>, FastingConfig> = {
  '12:12': { type: '12:12', fastingHours: 12, eatingHours: 12 },
  '14:10': { type: '14:10', fastingHours: 14, eatingHours: 10 },
  '16:8': { type: '16:8', fastingHours: 16, eatingHours: 8 },
  '18:6': { type: '18:6', fastingHours: 18, eatingHours: 6 },
};

export interface FastingSession {
  config: FastingConfig;
  eatingStartTime?: number;
  eatingEndTime?: number;
  fastingStartTime: number;
  fastingEndTime?: number;
  completedFastingMs?: number;
  reservedFastingStart?: number;
}

export interface SessionRecord {
  type: FastingType;
  fastingHours: number;
  completedMs: number;
  isSuccess: boolean;
  timestamp: number;
}

interface FastingState {
  phase: AppPhase;
  session: FastingSession | null;
  totalCompletedSessions: number;
  lastStatusMessage?: string;
  recentHistory: SessionRecord[];
}

const STORAGE_KEY = 'fasting-app-state';
const SUCCESS_THRESHOLD = 0.95; // 95% of target = success

function loadState(): FastingState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.phase === 'setup') parsed.phase = 'home';
      if (!parsed.recentHistory) parsed.recentHistory = [];
      return parsed;
    }
  } catch {}
  return { phase: 'home', session: null, totalCompletedSessions: 0, recentHistory: [] };
}

function saveState(state: FastingState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Get the most frequently used routine from recent history */
export function getMostUsedRoutine(history: SessionRecord[]): FastingType {
  if (history.length === 0) return '16:8';
  const freq: Record<string, number> = {};
  // Only look at last 10 sessions
  const recent = history.slice(-10);
  for (const r of recent) {
    freq[r.type] = (freq[r.type] || 0) + 1;
  }
  let maxType: FastingType = '16:8';
  let maxCount = 0;
  for (const [type, count] of Object.entries(freq)) {
    if (count > maxCount) { maxCount = count; maxType = type as FastingType; }
  }
  return maxType;
}

export function useFastingStore() {
  const [state, setState] = useState<FastingState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Check reserved fasting auto-start
  useEffect(() => {
    if (state.phase !== 'reserved' || !state.session?.reservedFastingStart) return;
    const checkReserved = () => {
      if (Date.now() >= state.session!.reservedFastingStart!) {
        setState(prev => {
          if (!prev.session) return prev;
          return {
            ...prev,
            phase: 'fasting',
            session: {
              ...prev.session,
              fastingStartTime: prev.session.reservedFastingStart!,
              reservedFastingStart: undefined,
            },
          };
        });
      }
    };
    checkReserved();
    const interval = setInterval(checkReserved, 1000);
    return () => clearInterval(interval);
  }, [state.phase, state.session?.reservedFastingStart]);

  // Home → directly start fasting (quick start)
  const startFastingDirect = useCallback((config: FastingConfig) => {
    const now = Date.now();
    setState(prev => ({
      ...prev,
      phase: 'fasting',
      session: {
        config,
        fastingStartTime: now,
      },
    }));
  }, []);

  // Home → start fasting with a past start time (already fasting flow)
  const startFastingFromPast = useCallback((config: FastingConfig, startTime: Date) => {
    setState(prev => ({
      ...prev,
      phase: 'fasting',
      session: {
        config,
        fastingStartTime: startTime.getTime(),
      },
    }));
  }, []);

  // Home → Eating
  const startEating = useCallback((config: FastingConfig) => {
    const now = Date.now();
    const eatingMs = config.eatingHours * 60 * 60 * 1000;
    setState(prev => ({
      ...prev,
      phase: 'eating',
      session: {
        config,
        eatingStartTime: now,
        eatingEndTime: now + eatingMs,
        fastingStartTime: now + eatingMs,
      },
    }));
  }, []);

  // Home → Reserved
  const reserveFasting = useCallback((config: FastingConfig, scheduledStart: Date) => {
    setState(prev => ({
      ...prev,
      phase: 'reserved',
      session: {
        config,
        fastingStartTime: scheduledStart.getTime(),
        reservedFastingStart: scheduledStart.getTime(),
      },
    }));
  }, []);

  // Eating → Fasting
  const startFasting = useCallback(() => {
    setState(prev => {
      if (!prev.session) return prev;
      const now = Date.now();
      return {
        ...prev,
        phase: 'fasting',
        session: {
          ...prev.session,
          fastingStartTime: now,
          fastingEndTime: undefined,
          completedFastingMs: undefined,
        },
      };
    });
  }, []);

  // Fasting → Result (95% threshold)
  const endFasting = useCallback(() => {
    setState(prev => {
      if (!prev.session) return prev;
      const now = Date.now();
      const completedMs = now - prev.session.fastingStartTime;
      const targetMs = prev.session.config.fastingHours * 60 * 60 * 1000;
      const isSuccess = completedMs >= targetMs * SUCCESS_THRESHOLD;

      const record: SessionRecord = {
        type: prev.session.config.type,
        fastingHours: prev.session.config.fastingHours,
        completedMs,
        isSuccess,
        timestamp: now,
      };

      return {
        ...prev,
        phase: 'result',
        session: {
          ...prev.session,
          fastingEndTime: now,
          completedFastingMs: completedMs,
        },
        totalCompletedSessions: isSuccess
          ? prev.totalCompletedSessions + 1
          : prev.totalCompletedSessions,
        lastStatusMessage: isSuccess
          ? `${prev.session.config.fastingHours}시간 단식을 성공했어요! 🎉`
          : undefined,
        recentHistory: [...prev.recentHistory, record].slice(-20), // keep last 20
      };
    });
  }, []);

  const goHome = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'home' }));
  }, []);

  const resetToHome = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'home', session: null, lastStatusMessage: undefined }));
  }, []);

  const updateStartTime = useCallback((newStartTime: Date) => {
    setState(prev => {
      if (!prev.session) return prev;
      return {
        ...prev,
        session: { ...prev.session, fastingStartTime: newStartTime.getTime() },
      };
    });
  }, []);

  const getCurrentStage = useCallback((): FastingStage | null => {
    if (!state.session || state.phase !== 'fasting') return null;
    const elapsedHours = (Date.now() - state.session.fastingStartTime) / (1000 * 60 * 60);
    let current = FASTING_STAGES[0];
    for (const stage of FASTING_STAGES) {
      if (elapsedHours >= stage.startHour) current = stage;
    }
    return current;
  }, [state.session, state.phase]);

  const updateReservedStart = useCallback((newStart: Date) => {
    setState(prev => {
      if (!prev.session) return prev;
      return {
        ...prev,
        session: {
          ...prev.session,
          fastingStartTime: newStart.getTime(),
          reservedFastingStart: newStart.getTime(),
        },
      };
    });
  }, []);

  const updateReservedConfig = useCallback((config: FastingConfig) => {
    setState(prev => {
      if (!prev.session) return prev;
      return {
        ...prev,
        session: { ...prev.session, config },
      };
    });
  }, []);

  return {
    ...state,
    startEating,
    startFastingDirect,
    startFastingFromPast,
    reserveFasting,
    startFasting,
    endFasting,
    goHome,
    resetToHome,
    updateStartTime,
    updateReservedStart,
    updateReservedConfig,
    getCurrentStage,
  };
}
