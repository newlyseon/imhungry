import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Trophy, CalendarClock } from 'lucide-react';
import { FastingConfig, FastingType, FASTING_PRESETS, SessionRecord, getMostUsedRoutine } from '@/hooks/useFastingStore';
import { formatWallClock, formatWallClockWithDay } from '@/lib/formatTime';
import { ReserveFastingSheet } from '@/components/ReserveFastingSheet';

interface HomeScreenProps {
  totalCompletedSessions: number;
  lastSession?: { config: FastingConfig } | null;
  statusMessage?: string;
  recentHistory: SessionRecord[];
  onStartFastingDirect: (config: FastingConfig) => void;
  onReserveFasting: (config: FastingConfig, scheduledStart: Date) => void;
}

const CARDS: { type: Exclude<FastingType, 'custom'>; label: string; subtitle: string }[] = [
  { type: '12:12', label: '12:12', subtitle: '입문' },
  { type: '16:8', label: '16:8', subtitle: '일반' },
  { type: '18:6', label: '18:6', subtitle: '상급' },
];

function getContextMotivation(history: SessionRecord[]): string | null {
  if (history.length === 0) return null;
  const last = history[history.length - 1];
  if (last.isSuccess) {
    return `어제는 ${last.fastingHours}시간 단식에 성공하셨어요! 오늘도 도전해볼까요? 🔥`;
  }
  const hours = Math.floor(last.completedMs / (1000 * 60 * 60));
  return `지난번 ${hours}시간이나 버티셨어요! 이번엔 꼭 성공해봐요 💪`;
}

export function HomeScreen({ totalCompletedSessions, statusMessage, recentHistory, onStartFastingDirect, onReserveFasting }: HomeScreenProps) {
  const [showReserve, setShowReserve] = useState(false);
  const mostUsed = getMostUsedRoutine(recentHistory);

  const motivation = statusMessage || getContextMotivation(recentHistory);

  const getMealTime = (fastingHours: number) => {
    return new Date(Date.now() + fastingHours * 60 * 60 * 1000);
  };

  return (
    <div className="h-screen bg-background px-5 flex flex-col pt-[40px] overflow-y-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-foreground">
            {new Date().getHours() < 12 ? '좋은 아침이에요 ☀️' : new Date().getHours() < 18 ? '오늘도 화이팅 👋' : '좋은 저녁이에요 🌇'}
          </h1>
          {totalCompletedSessions > 0 && (
            <div className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full">
              <Trophy size={14} className="text-foreground" />
              <span className="text-sm font-bold text-foreground">{totalCompletedSessions}회</span>
            </div>
          )}
        </div>
        <p className="text-base text-muted-foreground">단식 루틴을 선택하고 바로 시작하세요</p>
      </motion.div>

      {/* Fasting type cards */}
      <div className="flex flex-col gap-3 pb-8">
        {/* Reserve card */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowReserve(true)}
          className="relative w-full p-5 text-left border-0 hover:brightness-110 transition-all shadow-card rounded-md bg-emerald-600 text-white"
        >
          <div>
            <span className="text-xl font-bold">시작할 시간 설정하기</span>
            <p className="text-base opacity-70 mt-1">단식 예정이라면 시작할 시간을 예약해보세요</p>
          </div>
          <div className="mt-1 flex justify-end">
            <span className="text-center text-sm font-semibold rounded-xl px-[14px] py-[8px] bg-white text-emerald-700">예약하기</span>
          </div>
        </motion.button>

        {CARDS.map((card, i) => {
          const preset = FASTING_PRESETS[card.type];
          const mealTime = getMealTime(preset.fastingHours);

          return (
            <motion.button
              key={card.type}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 + i * 0.06 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onStartFastingDirect(preset)}
              className="relative w-full p-5 text-left bg-card border-0 hover:border-foreground/10 transition-all shadow-card rounded-md"
            >
              <div>
                <div className="gap-2 mb-1 items-center justify-start flex flex-row">
                  <span className="text-xl font-bold text-foreground">
                    {card.label} 단식
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {card.subtitle}
                  </span>
                </div>
                <p className="text-base text-muted-foreground">
                  지금 시작하면 <span className="font-semibold text-emerald-700">{formatWallClockWithDay(mealTime)}</span> 식사 가능
                </p>
              </div>

              <div className="mt-1 flex justify-end">
                <span className="text-center text-sm font-semibold text-primary-foreground bg-neutral-900 rounded-sm py-[8px] px-[14px]">시작하기</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      <ReserveFastingSheet
        open={showReserve}
        onOpenChange={setShowReserve}
        onReserve={onReserveFasting}
      />
    </div>
  );
}
