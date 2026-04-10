import { useState, useMemo } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { FastingConfig, FastingType, FASTING_PRESETS } from '@/hooks/useFastingStore';
import { formatWallClock, formatWallClockWithDay } from '@/lib/formatTime';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReserve: (config: FastingConfig, scheduledStart: Date) => void;
}

const TYPES: { type: Exclude<FastingType, 'custom'>; label: string; subtitle: string }[] = [
  { type: '12:12', label: '12:12', subtitle: '입문' },
  { type: '14:10', label: '14:10', subtitle: '표준' },
  { type: '16:8', label: '16:8', subtitle: '일반' },
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
    <Drawer
      anchor="bottom"
      open={open}
      onClose={() => onOpenChange(false)}
      PaperProps={{ sx: { maxHeight: '85vh' } }}
    >
      <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 0.5, lineHeight: 1.3 }}>
        단식을 시작할 시간을 정해주세요.
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        예약을 완료하면 바로 예약모드로 전환됩니다.
      </Typography>

      {/* Day selector */}
      <ToggleButtonGroup
        exclusive
        value={day}
        onChange={(_, v) => v && setDay(v)}
        fullWidth
        sx={{ mb: 2 }}
      >
        <ToggleButton value="today" sx={{ flex: 1, py: 1.5 }}>오늘</ToggleButton>
        <ToggleButton value="tomorrow" sx={{ flex: 1, py: 1.5 }}>내일</ToggleButton>
      </ToggleButtonGroup>

      {/* Time picker */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
        <FormControl>
          <Select
            value={isHourValid ? hour : ''}
            onChange={(e) => setHour(e.target.value)}
            displayEmpty
            sx={{ width: 96, height: 56, textAlign: 'center', fontWeight: 700, fontSize: '1.25rem' }}
            renderValue={(v) => v || '--'}
            MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          >
            {availableHours.map(i => {
              const label = i.toString().padStart(2, '0');
              return <MenuItem key={i} value={label}>{label}시</MenuItem>;
            })}
          </Select>
        </FormControl>
        <Typography variant="h5" fontWeight={700} color="text.primary">:</Typography>
        <FormControl>
          <Select
            value={isMinuteValid ? minute : ''}
            onChange={(e) => setMinute(e.target.value)}
            displayEmpty
            sx={{ width: 96, height: 56, textAlign: 'center', fontWeight: 700, fontSize: '1.25rem' }}
            renderValue={(v) => v || '--'}
            MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          >
            {availableMinutes.map(m => {
              const val = m.toString().padStart(2, '0');
              return <MenuItem key={m} value={val}>{val}분</MenuItem>;
            })}
          </Select>
        </FormControl>
      </Box>

      {/* Preview */}
      {scheduledDate && mealTime && (
        <Paper elevation={0} sx={{ bgcolor: 'grey.100', borderRadius: 3, p: 2, mb: 2.5, textAlign: 'center' }}>
          <Typography variant="body2" fontWeight={600} color="text.primary">
            설정한 시간에 단식을 시작하면
          </Typography>
          <Typography variant="body1" fontWeight={700} sx={{ color: 'primary.dark', mt: 0.5 }}>
            {formatWallClockWithDay(mealTime)}에 식사가 가능해요
          </Typography>
        </Paper>
      )}

      {/* Routine selector */}
      <ToggleButtonGroup
        exclusive
        value={selectedType}
        onChange={(_, v) => v && setSelectedType(v)}
        fullWidth
        sx={{ mb: 3 }}
      >
        {TYPES.map(t => (
          <ToggleButton key={t.type} value={t.type} sx={{ flex: 1, py: 1.5, flexDirection: 'column', gap: 0.25 }}>
            <Typography variant="body2" fontWeight={700}>{t.label}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.75 }}>{t.subtitle}</Typography>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/* CTA */}
      <Button
        variant="contained"
        fullWidth
        onClick={handleReserve}
        disabled={!scheduledDate}
        size="large"
        sx={{ borderRadius: 3 }}
      >
        {scheduledDate
          ? `${formatWallClock(scheduledDate)}에 단식 시작 예약하기`
          : '시간을 설정해주세요'}
      </Button>
    </Drawer>
  );
}
