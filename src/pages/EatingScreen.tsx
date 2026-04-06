import { useState } from 'react';
import { motion } from 'framer-motion';
import { CircleProgress } from '@/components/CircleProgress';
import { SettingsModal } from '@/components/SettingsModal';
import { useCountdown, useElapsed } from '@/hooks/useCountdown';
import { FastingSession } from '@/hooks/useFastingStore';
import { formatWallClock, formatTimerDisplay, formatWallClockWithDay } from '@/lib/formatTime';

interface EatingScreenProps {
  session: FastingSession;
  onStartFasting: () => void;
  onResetToSetup: () => void;
}

export function EatingScreen({ session, onStartFasting, onResetToSetup }: EatingScreenProps) {
  const [showElapsed, setShowElapsed] = useState(false);

  const eatingEnd = session.eatingEndTime || Date.now();
  const eatingStart = session.eatingStartTime || Date.now();
  const { formatted, isComplete } = useCountdown(eatingEnd);
  const { elapsedMs } = useElapsed(eatingStart);

  const totalEatingMs = session.config.eatingHours * 60 * 60 * 1000;
  const elapsed = Date.now() - eatingStart;
  const progress = Math.min(elapsed / totalEatingMs, 1);

  const elapsedFormatted = formatTimerDisplay(elapsedMs);
  const nextFastingEnd = new Date(eatingEnd + session.config.fastingHours * 60 * 60 * 1000);

  return (
    <div className="h-screen bg-eating flex flex-col items-center px-5 pt-8 overflow-hidden">
      <div className="flex-1 w-full overflow-y-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-eating">식사 중 🥗</h1>
            <p className="text-eating-muted text-sm mt-0.5">
              {session.config.type === 'custom' ? `${session.config.fastingHours}:${session.config.eatingHours}` : session.config.type} · 식사 시간
            </p>
          </div>
          <SettingsModal currentConfig={session.config} onResetToSetup={onResetToSetup} variant="eating" />
        </motion.div>

        {/* Wall clock context */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="w-full bg-eating-secondary rounded-2xl p-4 mb-8 text-center">
          <p className="text-eating text-base font-bold">
            <span className="text-eating-accent">{formatWallClock(new Date(eatingEnd))}</span>에 마지막 식사를 마치세요
          </p>
          <p className="text-eating-muted text-sm mt-1">맛있게 드시고 계신가요? 🥗</p>
        </motion.div>

        {/* Circle */}
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }} className="my-6 flex justify-center">
          <CircleProgress progress={progress} colorClass="eating">
            <span className="text-eating-muted text-xs mb-1">
              {isComplete ? '식사 시간 종료!' : showElapsed ? '경과 시간' : '식사 종료까지'}
            </span>
            <button
              onClick={() => setShowElapsed(prev => !prev)}
              className="text-4xl font-bold text-eating font-mono-num tracking-tight transition-opacity active:opacity-60"
            >
              {isComplete ? '00 : 00 : 00' : showElapsed ? elapsedFormatted : formatted}
            </button>
            {!isComplete && (
              <span className="text-eating-muted text-[11px] mt-1.5">
                {showElapsed
                  ? `시작: ${formatWallClock(new Date(eatingStart))}`
                  : `종료 예정: ${formatWallClock(new Date(eatingEnd))}`
                }
              </span>
            )}
          </CircleProgress>
        </motion.div>

        {/* Next fasting info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="w-full bg-eating-secondary rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-eating-accent/10 flex items-center justify-center text-lg">🌙</div>
            <div>
              <p className="text-eating text-sm font-semibold">
                <span className="text-eating-accent">{formatWallClock(new Date(eatingEnd))}</span> 단식 시작
              </p>
              <p className="text-eating-muted text-sm">
                {session.config.fastingHours}시간 단식 → {formatWallClockWithDay(nextFastingEnd)} 식사 가능
              </p>
            </div>
          </div>
        </motion.div>

        {/* Commerce */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="w-full bg-eating-secondary rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🥚</span>
            <div className="flex-1">
              <p className="text-eating text-sm font-semibold">단식 시작 전, 마지막으로 챙겨 먹기 좋은 단백질 간식</p>
              <p className="text-eating-muted text-xs mt-0.5">포만감을 오래 유지해줘요</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Early fasting */}
      <div className="w-full pb-8 pt-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onStartFasting()}
          className="w-full rounded-xl bg-eating-accent text-white font-semibold text-base py-[16px]"
        >
          지금 바로 단식 시작
        </motion.button>
        <p className="text-center text-xs text-eating-muted mt-3">
          식사를 일찍 마쳤다면 다음 사이클로 바로 진입하세요
        </p>
      </div>
    </div>
  );
}
