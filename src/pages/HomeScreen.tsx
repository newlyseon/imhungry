import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Trophy, CalendarClock } from 'lucide-react';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
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

  const motivation = statusMessage || getContextMotivation(recentHistory);

  const getMealTime = (fastingHours: number) => {
    return new Date(Date.now() + fastingHours * 60 * 60 * 1000);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? '좋은 아침이에요 ☀️' : hour < 18 ? '오늘도 화이팅 👋' : '좋은 저녁이에요 🌇';

  return (
    <Box sx={{ height: '100vh', bgcolor: 'background.default', px: 2.5, display: 'flex', flexDirection: 'column', pt: '40px', overflowY: 'auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="h5" fontWeight={800} color="text.primary">
            {greeting}
          </Typography>
          {totalCompletedSessions > 0 && (
            <Chip
              icon={<EmojiEventsIcon sx={{ fontSize: 16 }} />}
              label={`${totalCompletedSessions}회`}
              size="small"
              sx={{ fontWeight: 700, bgcolor: 'action.hover', color: 'text.primary', px: 0.5 }}
            />
          )}
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          단식 루틴을 선택하고 바로 시작하세요
        </Typography>
      </motion.div>

      {/* Cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pb: 4 }}>
        {/* Reserve card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileTap={{ scale: 0.97 }}
        >
          <Paper
            component="button"
            onClick={() => setShowReserve(true)}
            elevation={2}
            sx={{
              width: '100%',
              p: 2.5,
              textAlign: 'left',
              bgcolor: 'primary.main',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 1.2,
              transition: 'filter 0.15s',
              '&:hover': { filter: 'brightness(1.08)' },
              '&:active': { filter: 'brightness(0.95)' },
            }}
          >
            <Typography variant="h6" fontWeight={800} sx={{ color: 'white' }}>
              시작할 시간 설정하기
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
              단식 예정이라면 시작할 시간을 예약해보세요
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <Chip
                label="예약하기"
                size="small"
                sx={{
                  bgcolor: 'white',
                  color: 'primary.dark',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  px: 0.5,
                  height: 32,
                  borderRadius: '6px',
                }}
              />
            </Box>
          </Paper>
        </motion.div>

        {CARDS.map((card, i) => {
          const preset = FASTING_PRESETS[card.type];
          const mealTime = getMealTime(preset.fastingHours);

          return (
            <motion.div
              key={card.type}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 + i * 0.06 }}
              whileTap={{ scale: 0.97 }}
            >
              <Paper
                component="button"
                onClick={() => onStartFastingDirect(preset)}
                elevation={1}
                sx={{
                  width: '100%',
                  p: 2.5,
                  textAlign: 'left',
                  bgcolor: 'background.paper',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 1.2,
                  transition: 'box-shadow 0.15s',
                  '&:hover': { boxShadow: 3 },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="h6" fontWeight={800} color="text.primary">
                    {card.label} 단식
                  </Typography>
                  <Chip
                    label={card.subtitle}
                    size="small"
                    sx={{ fontSize: '0.7rem', height: 22, bgcolor: 'action.hover', color: 'text.secondary', fontWeight: 600 }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  <Box component="span" sx={{ fontWeight: 800, color: 'primary.dark' }}>
                    {formatWallClockWithDay(mealTime)}
                  </Box>{' '}
                  이 되면 식사 가능
                </Typography>

                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <Chip
                    label="시작하기"
                    size="small"
                    sx={{
                      bgcolor: 'secondary.main',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      px: 0.5,
                      height: 32,
                      borderRadius: '6px',
                    }}
                  />
                </Box>
              </Paper>
            </motion.div>
          );
        })}
      </Box>

      <ReserveFastingSheet
        open={showReserve}
        onOpenChange={setShowReserve}
        onReserve={onReserveFasting}
      />
    </Box>
  );
}
