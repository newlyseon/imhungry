import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CircleProgress } from '@/components/CircleProgress';
import { useCountdown, useElapsed } from '@/hooks/useCountdown';
import { FastingSession, FASTING_STAGES, FastingStage } from '@/hooks/useFastingStore';
import { formatWallClock, formatTimerDisplay } from '@/lib/formatTime';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

import fastingBg1 from '@/assets/fasting-bg-1.png';
import fastingBg2 from '@/assets/fasting-bg-2.png';

const FASTING_BGS = [fastingBg1, fastingBg2];

interface FastingScreenProps {
  session: FastingSession;
  onEndFasting: () => void;
  onResetToSetup: () => void;
  onUpdateStartTime: (newStartTime: Date) => void;
  getCurrentStage: () => FastingStage | null;
}

export function FastingScreen({ session, onEndFasting, onResetToSetup, onUpdateStartTime, getCurrentStage }: FastingScreenProps) {
  const [showNudge, setShowNudge] = useState(false);
  const [showElapsed, setShowElapsed] = useState(false);
  const [showEditTime, setShowEditTime] = useState(false);

  const bgImage = FASTING_BGS[Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % FASTING_BGS.length];

  const targetTime = session.fastingStartTime + session.config.fastingHours * 60 * 60 * 1000;
  const { formatted, isComplete } = useCountdown(targetTime);
  const { elapsedMs } = useElapsed(session.fastingStartTime);

  const totalMs = session.config.fastingHours * 60 * 60 * 1000;
  const progress = Math.min(elapsedMs / totalMs, 1);
  const progressPercent = Math.round(progress * 100);
  const currentStage = getCurrentStage();
  const currentStageIndex = currentStage ? FASTING_STAGES.findIndex(s => s.name === currentStage.name) : 0;

  const elapsedFormatted = formatTimerDisplay(elapsedMs);

  const remainingMs = Math.max(targetTime - Date.now(), 0);
  const remainingMin = Math.ceil(remainingMs / (1000 * 60));
  const remainingHours = Math.floor(remainingMin / 60);
  const remainingMinOnly = remainingMin % 60;
  const remainingText = remainingHours > 0 ? `${remainingHours}시간 ${remainingMinOnly}분` : `${remainingMinOnly}분`;

  const startDate = new Date(session.fastingStartTime);
  const [editDay, setEditDay] = useState<'today' | 'yesterday'>(() => {
    const today = new Date();
    return startDate.toDateString() === today.toDateString() ? 'today' : 'yesterday';
  });
  const [editHour, setEditHour] = useState(startDate.getHours().toString().padStart(2, '0'));
  const [editMinute, setEditMinute] = useState(startDate.getMinutes().toString().padStart(2, '0'));

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const availableHours = editDay === 'yesterday'
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: currentHour + 1 }, (_, i) => i);

  const availableMinutes = (editDay === 'today' && parseInt(editHour) === currentHour)
    ? Array.from({ length: 12 }, (_, i) => i * 5).filter(m => m <= currentMinute)
    : Array.from({ length: 12 }, (_, i) => i * 5);

  const isHourValid = availableHours.includes(parseInt(editHour));
  const isMinuteValid = availableMinutes.includes(parseInt(editMinute));

  const handleSaveStartTime = () => {
    const h = parseInt(editHour, 10);
    const m = parseInt(editMinute, 10);
    if (isNaN(h) || isNaN(m) || !isHourValid || !isMinuteValid) return;
    const newStart = new Date();
    if (editDay === 'yesterday') newStart.setDate(newStart.getDate() - 1);
    newStart.setHours(h, m, 0, 0);
    onUpdateStartTime(newStart);
    setShowEditTime(false);
  };

  const handleEndClick = () => {
    if (isComplete) { onEndFasting(); return; }
    setShowNudge(true);
  };

  return (
    <div className="h-screen flex flex-col items-center overflow-hidden relative">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-fasting" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full h-full px-5 pt-8">
        <div className="flex-1 w-full overflow-y-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
            <div className="mb-12">
              <h1 className="text-2xl font-bold text-fasting">단식 중 🌙</h1>
              <p className="text-fasting-muted text-sm mt-0.5">
                {session.config.type === 'custom' ? `${session.config.fastingHours}:${session.config.eatingHours}` : session.config.type} · {progressPercent}% 완료
              </p>
            </div>
          </motion.div>


          {/* Circle */}
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }} className="my-8 flex justify-center">
            <CircleProgress progress={progress} colorClass="fasting">
              <span className="text-white mb-1 text-lg font-bold pb-[6px] bg-transparent">
                {isComplete ? '목표 달성! 🎉' : showElapsed ? '지나간 시간' : '남은시간'}
              </span>
              <button
                onClick={() => setShowElapsed(prev => !prev)}
                className="text-4xl font-bold text-fasting font-mono-num tracking-tight transition-opacity active:opacity-60"
              >
                {isComplete ? '00 : 00 : 00' : showElapsed ? elapsedFormatted : formatted}
              </button>
              {!isComplete && (
                <span className="text-white/80 mt-1.5 text-base pt-[2px] opacity-70">
                  {showElapsed
                    ? `${formatWallClock(new Date(session.fastingStartTime))}에 시작했어요`
                    : `${formatWallClock(new Date(targetTime))}에 식사할 수 있어요`
                  }
                </span>
              )}
            </CircleProgress>
          </motion.div>

          {/* Stage stepper */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="w-full bg-fasting-secondary backdrop-blur-md p-5 mb-4 rounded-xl border border-fasting-ring">
            <h3 className="text-white-muted font-semibold mb-4 text-base text-fasting">현재 내 몸의 변화</h3>
            <div className="flex items-center gap-1 mb-6">
              {FASTING_STAGES.map((stage, i) => {
                const elapsedHours = elapsedMs / (1000 * 60 * 60);
                const stageStart = stage.startHour;
                const stageEnd = i < FASTING_STAGES.length - 1 ? FASTING_STAGES[i + 1].startHour : session.config.fastingHours;
                const stageRange = stageEnd - stageStart;
                const stageFill = stageRange > 0
                  ? Math.min(Math.max((elapsedHours - stageStart) / stageRange, 0), 1)
                  : 0;

                return (
                  <div key={stage.name} className="flex-1 flex flex-col items-center">
                    <div className="h-2.5 w-full rounded-full mb-2 bg-fasting-ring overflow-hidden">
                      <div
                        className="h-full rounded-full bg-fasting-accent transition-all duration-1000 ease-linear"
                        style={{ width: `${stageFill * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs text-center leading-tight ${stageFill > 0 ? 'text-fasting-accent' : 'text-fasting-muted'}`}>{stage.name}</span>
                  </div>
                );
              })}
            </div>
            {currentStage && (
              <motion.p key={currentStage.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-fasting text-base text-center">
                {currentStage.description}
              </motion.p>
            )}
          </motion.div>
        </div>

        {/* Bottom actions */}
        <div className="w-full pb-8 pt-4">
          {!showNudge && (
            <>
              <button onClick={handleEndClick} className="w-full rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold text-base transition-colors py-[16px]">
                단식 종료
              </button>
              <button
                onClick={() => { const d = new Date(session.fastingStartTime); setEditHour(d.getHours().toString().padStart(2, '0')); setEditMinute(d.getMinutes().toString().padStart(2, '0')); setShowEditTime(true); }}
                className="w-full mt-2 py-2 text-fasting-muted hover:text-white transition-colors text-sm"
              >
                시작 시간 수정하기
              </button>
            </>
          )}
        </div>
      </div>

      {/* Edit start time sheet */}
      <Sheet open={showEditTime} onOpenChange={setShowEditTime}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-8 pt-6 bg-fasting-heavy backdrop-blur-xl border-0">
          <SheetHeader className="text-left mb-4">
            <SheetTitle className="text-lg font-bold text-fasting">시작 시간 수정</SheetTitle>
            <SheetDescription className="text-sm text-fasting-muted">단식 시작시간은 현재시간 이전으로만 설정할 수 있어요.</SheetDescription>
          </SheetHeader>
          <div className="gap-2 mb-4 pb-[2px] pt-[2px] text-center flex items-center justify-center py-0">
            <button
              onClick={() => setEditDay('today')}
              className={`px-8 py-2 rounded-xl text-sm font-semibold transition-all ${editDay === 'today' ? 'bg-white/20 text-white border border-white/30' : 'border border-fasting-ring text-fasting-muted hover:text-white'}`}
            >
              오늘
            </button>
            <button
              onClick={() => setEditDay('yesterday')}
              className={`px-8 py-2 rounded-xl text-sm font-semibold transition-all ${editDay === 'yesterday' ? 'bg-white/20 text-white border border-white/30' : 'border border-fasting-ring text-fasting-muted hover:text-white'}`}
            >
              어제
            </button>
          </div>

          <div className="flex flex-col items-center gap-2 my-2 pb-[16px] pt-[8px]">
            <div className="flex items-center justify-center gap-2">
              <Select value={isHourValid ? editHour : ''} onValueChange={setEditHour}>
                <SelectTrigger className="w-24 text-center text-xl font-bold bg-fasting-secondary backdrop-blur-md border-fasting-ring text-fasting h-14">
                  <SelectValue placeholder="--" />
                </SelectTrigger>
                <SelectContent className="bg-fasting-heavy backdrop-blur-xl border-fasting-ring max-h-[200px]">
                  {availableHours.map(i => {
                    const label = i.toString().padStart(2, '0');
                    return (
                      <SelectItem key={i} value={label} className="text-fasting">
                        {label}시
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <span className="text-fasting text-xl font-bold">:</span>
              <Select value={isMinuteValid ? editMinute : ''} onValueChange={setEditMinute}>
                <SelectTrigger className="w-24 text-center text-xl font-bold bg-fasting-secondary backdrop-blur-md border-fasting-ring text-fasting h-14">
                  <SelectValue placeholder="--" />
                </SelectTrigger>
                <SelectContent className="bg-fasting-heavy backdrop-blur-xl border-fasting-ring max-h-[200px]">
                  {availableMinutes.map(m => {
                    const val = m.toString().padStart(2, '0');
                    return (
                      <SelectItem key={m} value={val} className="text-fasting">
                        {val}분
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {isHourValid && isMinuteValid && (
              <span className="text-fasting-accent text-sm font-semibold">
                {editHour}시 {editMinute}분
              </span>
            )}
          </div>
          <button onClick={handleSaveStartTime} disabled={!isHourValid || !isMinuteValid} className="w-full rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed py-[16px]">저장</button>
        </SheetContent>
      </Sheet>

      {/* Nudge sheet */}
      <Sheet open={showNudge && !isComplete} onOpenChange={setShowNudge}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-8 pt-6 bg-fasting-heavy backdrop-blur-xl border-0">
          <SheetHeader className="text-left mb-5">
            <SheetTitle className="text-lg font-bold text-fasting">
              목표까지 <span className="text-fasting-accent">{remainingText}</span> 남았습니다
            </SheetTitle>
            <SheetDescription className="text-sm text-fasting-muted">
              조금만 더 하면 {FASTING_STAGES[Math.min(currentStageIndex + 1, FASTING_STAGES.length - 1)].name} 단계예요! 💪
            </SheetDescription>
          </SheetHeader>
          <div className="flex gap-3">
            <button onClick={() => setShowNudge(false)} className="flex-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold text-base py-[16px]">계속 할게요</button>
            <button onClick={onEndFasting} className="flex-1 rounded-xl border border-fasting-ring text-fasting-muted font-semibold text-base py-[16px]">그래도 종료</button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
