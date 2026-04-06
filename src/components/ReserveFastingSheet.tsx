import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FastingConfig, FastingType, FASTING_PRESETS } from '@/hooks/useFastingStore';
import { formatWallClock, formatWallClockWithDay } from '@/lib/formatTime';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReserve: (config: FastingConfig, scheduledStart: Date) => void;
}

const TYPES: { type: Exclude<FastingType, 'custom'>; label: string; subtitle: string }[] = [
  { type: '12:12', label: '12:12', subtitle: '입문' },
  { type: '16:8', label: '16:8', subtitle: '일반' },
  { type: '18:6', label: '18:6', subtitle: '상급' },
];

export function ReserveFastingSheet({ open, onOpenChange, onReserve }: Props) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const defaultTime = (() => {
    const d = new Date(now.getTime() + 5 * 60 * 1000);
    const m = Math.ceil(d.getMinutes() / 5) * 5;
    if (m >= 60) d.setHours(d.getHours() + 1);
    return { h: d.getHours() % 24, m: m % 60 };
  })();

  const [day, setDay] = useState<'today' | 'tomorrow'>('today');
  const [hour, setHour] = useState(defaultTime.h.toString().padStart(2, '0'));
  const [minute, setMinute] = useState(defaultTime.m.toString().padStart(2, '0'));
  const [selectedType, setSelectedType] = useState<Exclude<FastingType, 'custom'>>('16:8');

  const config: FastingConfig = FASTING_PRESETS[selectedType];

  const availableHours = day === 'tomorrow'
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: 24 }, (_, i) => i).filter(i => i > currentHour || (i === currentHour && currentMinute < 55));

  const availableMinutes = (day === 'today' && parseInt(hour) === currentHour)
    ? Array.from({ length: 12 }, (_, i) => i * 5).filter(m => m > currentMinute)
    : Array.from({ length: 12 }, (_, i) => i * 5);

  const isHourValid = availableHours.includes(parseInt(hour));
  const isMinuteValid = availableMinutes.includes(parseInt(minute));

  const scheduledDate = useMemo(() => {
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    if (isNaN(h) || isNaN(m) || !isHourValid || !isMinuteValid) return null;
    const d = new Date();
    if (day === 'tomorrow') d.setDate(d.getDate() + 1);
    d.setHours(h, m, 0, 0);
    return d;
  }, [hour, minute, day, isHourValid, isMinuteValid]);

  const mealTime = scheduledDate
    ? new Date(scheduledDate.getTime() + config.fastingHours * 60 * 60 * 1000)
    : null;

  const handleReserve = () => {
    if (!scheduledDate) return;
    onReserve(config, scheduledDate);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-8 pt-6 max-h-[85vh] bg-background border-0">
        <SheetHeader className="text-left mb-5">
          <SheetTitle className="text-xl font-bold text-foreground leading-snug">
            단식을 시작할 시간을 정해주세요.
          </SheetTitle>
          <SheetDescription className="text-base text-muted-foreground">
            예약을 완료하면 바로 예약모드로 전환됩니다.
          </SheetDescription>
        </SheetHeader>

        {/* Day selector */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            onClick={() => setDay('today')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              day === 'today'
                ? 'bg-emerald-600 text-white'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            오늘
          </button>
          <button
            onClick={() => setDay('tomorrow')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              day === 'tomorrow'
                ? 'bg-emerald-600 text-white'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            내일
          </button>
        </div>

        {/* Time Picker */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <Select value={isHourValid ? hour : ''} onValueChange={setHour}>
            <SelectTrigger className="w-24 text-center text-xl font-bold h-14">
              <SelectValue placeholder="--" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {availableHours.map(i => {
                const label = i.toString().padStart(2, '0');
                return (
                  <SelectItem key={i} value={label}>{label}시</SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <span className="text-xl font-bold text-foreground">:</span>
          <Select value={isMinuteValid ? minute : ''} onValueChange={setMinute}>
            <SelectTrigger className="w-24 text-center text-xl font-bold h-14">
              <SelectValue placeholder="--" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {availableMinutes.map(m => {
                const val = m.toString().padStart(2, '0');
                return (
                  <SelectItem key={m} value={val}>{val}분</SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Dynamic info */}
        {scheduledDate && mealTime && (
          <div className="bg-muted rounded-2xl p-4 mb-5 text-center">
            <p className="text-base text-foreground font-semibold">
              설정한 시간에 단식을 시작하면
            </p>
            <p className="text-base text-emerald-700 font-bold mt-1">
              {formatWallClockWithDay(mealTime)}에 식사가 가능해요
            </p>
          </div>
        )}

        {/* Type Selector */}
        <div className="flex gap-2 mb-6">
          {TYPES.map(t => (
            <button
              key={t.type}
              onClick={() => setSelectedType(t.type)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex flex-col items-center gap-0.5 ${
                selectedType === t.type
                  ? 'bg-emerald-600 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <span>{t.label}</span>
              <span className={`text-xs font-normal ${selectedType === t.type ? 'opacity-80' : ''}`}>{t.subtitle}</span>
            </button>
          ))}
        </div>

        {/* Action */}
        <button
          onClick={handleReserve}
          disabled={!scheduledDate}
          className="w-full rounded-xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed py-[16px]"
        >
          {scheduledDate
            ? `${formatWallClock(scheduledDate)}에 단식 시작 예약하기`
            : '시간을 설정해주세요'}
        </button>
      </SheetContent>
    </Sheet>
  );
}
