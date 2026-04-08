import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Drawer from '@mui/material/Drawer';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Chip from '@mui/material/Chip';
import { FastingSession, FastingType, FASTING_PRESETS, FastingConfig } from '@/hooks/useFastingStore';
import { useCountdown } from '@/hooks/useCountdown';
import { formatWallClock, formatWallClockWithDay } from '@/lib/formatTime';

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

  const currentType = session.config.type === 'custom' ? '16:8' : session.config.type as Exclude<FastingType, 'custom'>;
  const [selectedRoutine, setSelectedRoutine] = useState<Exclude<FastingType, 'custom'>>(currentType);

  const handleConfirmChangeRoutine = () => {
    onUpdateReservedConfig(FASTING_PRESETS[selectedRoutine]);
    setShowChangeRoutine(false);
  };

  return (
    <Box sx={{ height: '100vh', bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', alignItems: 'center', px: 2.5, pt: 4, overflow: 'hidden' }}>
      <Box sx={{ flex: 1, width: '100%', overflowY: 'auto' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h5" fontWeight={700} color="text.primary">단식 예약중</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {session.config.type === 'custom' ? `${session.config.fastingHours}:${session.config.eatingHours}` : session.config.type} · {formatWallClock(reservedDate)} 시작
              </Typography>
            </Box>
          </Box>
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 7, mb: 5 }}>
            <Typography sx={{ fontSize: 72, mb: 3, lineHeight: 1 }}>{foodEmoji}</Typography>
            <Typography variant="h6" fontWeight={700} textAlign="center" color="text.primary" sx={{ mb: 0.5 }}>
              {isComplete ? '곧 단식이 시작됩니다...' : (
                <>단식 시작까지 <Box component="span" sx={{ color: 'primary.dark' }}>{formatted}</Box> 남았어요</>
              )}
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              좋아하는 음식, 맛있게 드세요.
            </Typography>
          </Box>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Paper elevation={0} sx={{ bgcolor: 'grey.100', borderRadius: 4, p: 2.5, mb: 2 }}>
            <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ mb: 1.5 }}>예약 목표</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" color="text.secondary">단식 루틴</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" fontWeight={700} color="text.primary">
                    {session.config.type === 'custom' ? '커스텀' : session.config.type}
                  </Typography>
                  <Chip
                    label="변경"
                    size="small"
                    onClick={() => setShowChangeRoutine(true)}
                    sx={{ fontSize: '0.7rem', height: 24, fontWeight: 600, bgcolor: 'primary.main', color: 'white', cursor: 'pointer' }}
                  />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" color="text.secondary">단식 시작</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" fontWeight={700} color="text.primary">
                    {formatWallClock(reservedDate)}
                  </Typography>
                  <Chip
                    label="변경"
                    size="small"
                    onClick={() => setShowChangeTime(true)}
                    sx={{ fontSize: '0.7rem', height: 24, fontWeight: 600, bgcolor: 'primary.main', color: 'white', cursor: 'pointer' }}
                  />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" color="text.secondary">식사 가능</Typography>
                <Typography variant="body1" fontWeight={700} sx={{ color: 'primary.dark' }}>
                  {formatWallClockWithDay(fastingEndDate)}부터
                </Typography>
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Box>

      <Box sx={{ width: '100%', pb: 4, pt: 2 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={onResetToSetup}
          size="large"
          sx={{ borderRadius: 3 }}
        >
          예약 취소
        </Button>
      </Box>

      {/* Change time drawer */}
      <Drawer anchor="bottom" open={showChangeTime} onClose={() => setShowChangeTime(false)}>
        <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
          단식 시작 시간 변경
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          새로운 시작 시간을 설정하세요
        </Typography>

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

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
          <FormControl>
            <Select
              value={isHourValid ? editHour : ''}
              onChange={(e) => setEditHour(e.target.value)}
              displayEmpty
              sx={{ width: 96, height: 56, textAlign: 'center', fontWeight: 700, fontSize: '1.25rem' }}
              renderValue={(v) => v || '--'}
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
              value={isMinuteValid ? editMinute : ''}
              onChange={(e) => setEditMinute(e.target.value)}
              displayEmpty
              sx={{ width: 96, height: 56, textAlign: 'center', fontWeight: 700, fontSize: '1.25rem' }}
              renderValue={(v) => v || '--'}
            >
              {availableMinutes.map(m => {
                const val = m.toString().padStart(2, '0');
                return <MenuItem key={m} value={val}>{val}분</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Box>

        {newScheduledDate && (
          <Paper elevation={0} sx={{ bgcolor: 'grey.100', borderRadius: 3, p: 2, mb: 2.5, textAlign: 'center' }}>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {formatWallClock(newScheduledDate)}에 단식 시작
            </Typography>
            <Typography variant="body1" fontWeight={700} sx={{ color: 'primary.dark', mt: 0.5 }}>
              {formatWallClockWithDay(new Date(newScheduledDate.getTime() + session.config.fastingHours * 60 * 60 * 1000))}에 식사 가능
            </Typography>
          </Paper>
        )}

        <Button
          variant="contained"
          fullWidth
          onClick={handleConfirmChangeTime}
          disabled={!newScheduledDate}
          size="large"
          sx={{ borderRadius: 3 }}
        >
          시간 변경하기
        </Button>
      </Drawer>

      {/* Change routine drawer */}
      <Drawer anchor="bottom" open={showChangeRoutine} onClose={() => setShowChangeRoutine(false)}>
        <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
          단식 루틴 변경
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          변경할 단식 루틴을 선택하세요
        </Typography>

        <ToggleButtonGroup
          exclusive
          value={selectedRoutine}
          onChange={(_, v) => v && setSelectedRoutine(v)}
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

        <Button
          variant="contained"
          fullWidth
          onClick={handleConfirmChangeRoutine}
          size="large"
          sx={{ borderRadius: 3 }}
        >
          루틴 변경하기
        </Button>
      </Drawer>
    </Box>
  );
}
