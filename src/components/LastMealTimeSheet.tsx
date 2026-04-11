import { useState, useMemo } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (lastMealTime: Date) => void;
}

export function LastMealTimeSheet({ open, onOpenChange, onConfirm }: Props) {
  const now = new Date();

  const [day, setDay] = useState<'today' | 'yesterday'>('today');
  const [hour, setHour] = useState(now.getHours().toString().padStart(2, '0'));
  const [minute, setMinute] = useState(
    (Math.floor(now.getMinutes() / 5) * 5).toString().padStart(2, '0')
  );

  const availableHours =
    day === 'yesterday'
      ? Array.from({ length: 24 }, (_, i) => i)
      : Array.from({ length: now.getHours() + 1 }, (_, i) => i);

  const availableMinutes =
    day === 'today' && parseInt(hour) === now.getHours()
      ? Array.from({ length: 12 }, (_, i) => i * 5).filter((m) => m <= now.getMinutes())
      : Array.from({ length: 12 }, (_, i) => i * 5);

  const isHourValid = availableHours.includes(parseInt(hour));
  const isMinuteValid = availableMinutes.includes(parseInt(minute));

  const selectedDate = useMemo(() => {
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    if (isNaN(h) || isNaN(m) || !isHourValid || !isMinuteValid) return null;
    const d = new Date();
    if (day === 'yesterday') d.setDate(d.getDate() - 1);
    d.setHours(h, m, 0, 0);
    return d;
  }, [hour, minute, day, isHourValid, isMinuteValid]);

  const handleDayChange = (_: React.MouseEvent, v: 'today' | 'yesterday' | null) => {
    if (!v) return;
    setDay(v);
    if (v === 'today') {
      setHour(now.getHours().toString().padStart(2, '0'));
      setMinute((Math.floor(now.getMinutes() / 5) * 5).toString().padStart(2, '0'));
    } else {
      setHour('12');
      setMinute('00');
    }
  };

  const handleConfirm = () => {
    if (!selectedDate) return;
    onConfirm(selectedDate);
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
        마지막 식사를 마친 시간이 언제인가요?
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        입력한 시간부터 단식이 시작됩니다.
      </Typography>

      {/* Day selector */}
      <ToggleButtonGroup
        exclusive
        value={day}
        onChange={handleDayChange}
        fullWidth
        sx={{ mb: 2 }}
      >
        <ToggleButton value="today" sx={{ flex: 1, py: 1.5 }}>오늘</ToggleButton>
        <ToggleButton value="yesterday" sx={{ flex: 1, py: 1.5 }}>어제</ToggleButton>
      </ToggleButtonGroup>

      {/* Time picker */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 3 }}>
        <FormControl>
          <Select
            value={isHourValid ? hour : ''}
            onChange={(e) => setHour(e.target.value)}
            displayEmpty
            sx={{ width: 96, height: 56, textAlign: 'center', fontWeight: 700, fontSize: '1.25rem' }}
            renderValue={(v) => v || '--'}
            MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
          >
            {availableHours.map((i) => {
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
            {availableMinutes.map((m) => {
              const val = m.toString().padStart(2, '0');
              return <MenuItem key={m} value={val}>{val}분</MenuItem>;
            })}
          </Select>
        </FormControl>
      </Box>

      {/* CTA */}
      <Button
        variant="contained"
        fullWidth
        onClick={handleConfirm}
        disabled={!selectedDate}
        size="large"
        sx={{ borderRadius: 3 }}
      >
        {selectedDate ? '단식 시작하기' : '시간을 선택해주세요'}
      </Button>
    </Drawer>
  );
}
