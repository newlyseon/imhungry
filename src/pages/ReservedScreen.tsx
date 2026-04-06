import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FastingSession, FastingType, FASTING_PRESETS, FastingConfig } from '@/hooks/useFastingStore';
import { useCountdown } from '@/hooks/useCountdown';
import { formatWallClock, formatWallClockWithDay } from '@/lib/formatTime';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const FOOD_EMOJIS = ['🍕', '🍔', '🍣', '🍜', '🥗', '🍝', '🌮', '🍱', '🥘', '🍛', '🍲', '🥩', '🍤', '🥟', '🧆'];

function getRandomEmoji() {
  return FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)];
}

const TYPES: { type: Exclude<FastingType, 'custom'>; label: string; subtitle: string }[] = [
  { type: '12:12', label: '12:12', subtitle: '입문' },
  { type: '16:8', label: '16:8', subtitle: '일반' },
  { type: '18:6', label: '18:6', subtitle: '상급' },
];

interface ReservedScreenProps {
  session: FastingSession;
  onResetToSetup: () => void;
  onUpdateReservedStart: (newStart: Date) => void;
  onUpdateReservedConfig: (config: FastingConfig) => void;
}

export function ReservedScreen({ session, onResetToSetup, onUpdateReservedStart, onUpdateReservedConfig }: ReservedScreenProps) {
  const reservedTime = session.reservedFastingStart || session.fastingStartTime;
  const { formatted, isComplete } = useCountdown(reservedTime);
  const reservedDate = new Date(reservedTime);
  const fastingEndDate = new Date(reservedTime + session.config.fastingHours * 60 * 60 * 1000);

  const [showChangeTime, setShowChangeTime] = useState(false);
  const [showChangeRoutine, setShowChangeRoutine] = useState(false);
  const [foodEmoji] = useState(() => getRandomEmoji());

  // Time change state
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const [day, setDay] = useState<'today' | 'tomorrow'>('today');
  const [editHour, setEditHour] = useState(() => reservedDate.getHours().toString().padStart(2, '0'));
  const [editMinute, setEditMinute] = useState(() => {
    const m = Math.ceil(reservedDate.getMinutes() / 5) * 5;
    return (m < 60 ? m : 0).toString().padStart(2, '0');
  });

  const availableHours = day === 'tomorrow'
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: 24 }, (_, i) => i).filter(i => i > currentHour || (i === currentHour && currentMinute < 55));

  const availableMinutes = (day === 'today' && parseInt(editHour) === currentHour)
    ? Array.from({ length: 12 }, (_, i) => i * 5).filter(m => m > currentMinute)
    : Array.from({ length: 12 }, (_, i) => i * 5);

  const isHourValid = availableHours.includes(parseInt(editHour));
  const isMinuteValid = availableMinutes.includes(parseInt(editMinute));

  const newScheduledDate = useMemo(() => {
    const h = parseInt(editHour, 10);
    const m = parseInt(editMinute, 10);
    if (isNaN(h) || isNaN(m) || !isHourValid || !isMinuteValid) return null;
    const d = new Date();
    if (day === 'tomorrow') d.setDate(d.getDate() + 1);
    d.setHours(h, m, 0, 0);
    return d;
  }, [editHour, editMinute, day, isHourValid, isMinuteValid]);

  const handleConfirmChangeTime = () => {
    if (!newScheduledDate) return;
    onUpdateReservedStart(newScheduledDate);
    setShowChangeTime(false);
  };

  // Routine change state
  const currentType = session.config.type === 'custom' ? '16:8' : session.config.type as Exclude<FastingType, 'custom'>;
  const [selectedRoutine, setSelectedRoutine] = useState<Exclude<FastingType, 'custom'>>(currentType);

  const handleConfirmChangeRoutine = () => {
    onUpdateReservedConfig(FASTING_PRESETS[selectedRoutine]);
    setShowChangeRoutine(false);
  };

  return (
    <div className="h-screen bg-white flex flex-col items-center px-5 pt-8 overflow-hidden">
      <div className="flex-1 w-full overflow-y-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">단식 예약중</h1>
            <p className="text-muted-foreground text-base mt-0.5">
              {session.config.type === 'custom' ? `${session.config.fastingHours}:${session.config.eatingHours}` : session.config.type} · {formatWallClock(reservedDate)} 시작
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="flex flex-col items-center mt-[56px] mb-10"
        >
          <div className="mb-6">
            <span className="text-7xl">{foodEmoji}</span>
          </div>
          <p className="text-foreground text-xl font-bold mb-1 text-center">
            {isComplete ? '곧 단식이 시작됩니다...' : <>단식 시작까지 <span className="text-emerald-700">{formatted}</span> 남았어요</>}
          </p>
          <p className="text-muted-foreground text-base text-center">좋아하는 음식, 맛있게 드세요.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full bg-slate-100 rounded-2xl p-5 mb-4"
        >
          <h3 className="text-sm text-muted-foreground font-semibold mb-3">예약 목표</h3>
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">단식 루틴</span>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-foreground">{session.config.type === 'custom' ? '커스텀' : session.config.type}</span>
                <button
                  onClick={() => setShowChangeRoutine(true)}
                  className="text-xs font-semibold text-primary px-2 py-0.5 rounded-[6px] bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                  변경
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">단식 시작</span>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-foreground">{formatWallClock(reservedDate)}</span>
                <button
                  onClick={() => setShowChangeTime(true)}
                  className="text-xs font-semibold text-primary px-2 py-0.5 rounded-[6px] bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                  변경
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base text-muted-foreground">식사 가능</span>
              <span className="text-base font-bold text-emerald-700">{formatWallClockWithDay(fastingEndDate)}부터</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="w-full pb-8 pt-4">
        <button
          onClick={onResetToSetup}
          className="w-full rounded-xl bg-primary text-primary-foreground font-semibold text-base py-[16px]"
        >
          예약 취소
        </button>
      </div>

      {/* Change time sheet */}
      <Sheet open={showChangeTime} onOpenChange={setShowChangeTime}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-8 pt-6 bg-background border-0">
          <SheetHeader className="text-left mb-5">
            <SheetTitle className="text-lg font-bold text-foreground">단식 시작 시간 변경</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">새로운 시작 시간을 설정하세요</SheetDescription>
          </SheetHeader>

          <div className="flex items-center justify-center gap-2 mb-4">
            <button
              onClick={() => setDay('today')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${day === 'today' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}
            >
              오늘
            </button>
            <button
              onClick={() => setDay('tomorrow')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${day === 'tomorrow' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}
            >
              내일
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">
            <Select value={isHourValid ? editHour : ''} onValueChange={setEditHour}>
              <SelectTrigger className="w-24 text-center text-xl font-bold h-14">
                <SelectValue placeholder="--" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {availableHours.map(i => {
                  const label = i.toString().padStart(2, '0');
                  return <SelectItem key={i} value={label}>{label}시</SelectItem>;
                })}
              </SelectContent>
            </Select>
            <span className="text-xl font-bold text-foreground">:</span>
            <Select value={isMinuteValid ? editMinute : ''} onValueChange={setEditMinute}>
              <SelectTrigger className="w-24 text-center text-xl font-bold h-14">
                <SelectValue placeholder="--" />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {availableMinutes.map(m => {
                  const val = m.toString().padStart(2, '0');
                  return <SelectItem key={m} value={val}>{val}분</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>

          {newScheduledDate && (
            <div className="bg-muted rounded-2xl p-4 mb-5 text-center">
              <p className="text-sm text-foreground font-semibold">{formatWallClock(newScheduledDate)}에 단식 시작</p>
              <p className="text-base text-emerald-700 font-bold mt-1">
                {formatWallClockWithDay(new Date(newScheduledDate.getTime() + session.config.fastingHours * 60 * 60 * 1000))}에 식사 가능
              </p>
            </div>
          )}

          <button
            onClick={handleConfirmChangeTime}
            disabled={!newScheduledDate}
            className="w-full rounded-xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed py-[16px]"
          >
            시간 변경하기
          </button>
        </SheetContent>
      </Sheet>

      {/* Change routine sheet */}
      <Sheet open={showChangeRoutine} onOpenChange={setShowChangeRoutine}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-8 pt-6 bg-background border-0">
          <SheetHeader className="text-left mb-5">
            <SheetTitle className="text-lg font-bold text-foreground">단식 루틴 변경</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">변경할 단식 루틴을 선택하세요</SheetDescription>
          </SheetHeader>

          <div className="flex gap-2 mb-6">
            {TYPES.map(t => (
              <button
                key={t.type}
                onClick={() => setSelectedRoutine(t.type)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex flex-col items-center gap-0.5 ${
                  selectedRoutine === t.type ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
                }`}
              >
                <span>{t.label}</span>
                <span className={`text-xs font-normal ${selectedRoutine === t.type ? 'opacity-80' : ''}`}>{t.subtitle}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleConfirmChangeRoutine}
            className="w-full rounded-xl bg-primary text-primary-foreground font-semibold text-base py-[16px]"
          >
            루틴 변경하기
          </button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
