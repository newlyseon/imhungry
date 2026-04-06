import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FastingConfig } from '@/hooks/useFastingStore';
import { formatWallClock, formatWallClockWithDay } from '@/lib/formatTime';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: FastingConfig;
  onReserve: (scheduledStart: Date) => void;
}

export function ReserveFastingDialog({ open, onOpenChange, config, onReserve }: Props) {
  const [hour, setHour] = useState('22');
  const [minute, setMinute] = useState('00');

  const handleReserve = () => {
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return;

    const scheduled = new Date();
    scheduled.setHours(h, m, 0, 0);
    if (scheduled.getTime() <= Date.now()) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
    onReserve(scheduled);
    onOpenChange(false);
  };

  const previewDate = (() => {
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    if (isNaN(h) || isNaN(m)) return null;
    const d = new Date();
    d.setHours(h, m, 0, 0);
    if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
    return d;
  })();

  const fastingEndPreview = previewDate
    ? new Date(previewDate.getTime() + config.fastingHours * 60 * 60 * 1000)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-[340px]">
        <DialogHeader>
          <DialogTitle>단식 예약하기</DialogTitle>
          <DialogDescription>설정한 시각에 자동으로 단식이 시작됩니다</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-2 my-4">
          <Input
            type="number" min={0} max={23}
            value={hour}
            onChange={e => setHour(e.target.value)}
            className="w-20 text-center text-2xl font-bold"
          />
          <span className="text-2xl font-bold">:</span>
          <Input
            type="number" min={0} max={59}
            value={minute}
            onChange={e => setMinute(e.target.value)}
            className="w-20 text-center text-2xl font-bold"
          />
        </div>

        {previewDate && fastingEndPreview && (
          <div className="bg-muted rounded-xl p-3 text-center mb-4">
            <p className="text-sm text-foreground font-semibold">
              {formatWallClock(previewDate)}에 단식 시작
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {config.fastingHours}시간 뒤 {formatWallClockWithDay(fastingEndPreview)} 식사 가능
            </p>
          </div>
        )}

        <button
          onClick={handleReserve}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
        >
          예약 확정
        </button>
      </DialogContent>
    </Dialog>
  );
}
