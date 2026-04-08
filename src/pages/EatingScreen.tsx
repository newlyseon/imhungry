import { useState } from 'react';
import { motion } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
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
    <Box
      sx={{
        height: '100vh',
        bgcolor: 'hsl(145, 30%, 96%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 2.5,
        pt: 4,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ flex: 1, width: '100%', overflowY: 'auto' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h5" fontWeight={700} sx={{ color: 'hsl(150, 30%, 10%)' }}>
                식사 중 🥗
              </Typography>
              <Typography variant="body2" sx={{ color: 'hsl(150, 20%, 40%)', mt: 0.5 }}>
                {session.config.type === 'custom' ? `${session.config.fastingHours}:${session.config.eatingHours}` : session.config.type} · 식사 시간
              </Typography>
            </Box>
            <SettingsModal currentConfig={session.config} onResetToSetup={onResetToSetup} variant="eating" />
          </Box>
        </motion.div>

        {/* Wall clock context */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Paper
            elevation={0}
            sx={{
              bgcolor: 'hsl(145, 25%, 92%)',
              borderRadius: 4,
              p: 2,
              mb: 4,
              textAlign: 'center',
            }}
          >
            <Typography variant="body1" fontWeight={700} sx={{ color: 'hsl(150, 30%, 10%)' }}>
              <Box component="span" sx={{ color: 'hsl(145, 55%, 42%)', fontWeight: 700 }}>
                {formatWallClock(new Date(eatingEnd))}
              </Box>
              에 마지막 식사를 마치세요
            </Typography>
            <Typography variant="body2" sx={{ color: 'hsl(150, 20%, 40%)', mt: 0.5 }}>
              맛있게 드시고 계신가요? 🥗
            </Typography>
          </Paper>
        </motion.div>

        {/* Circle */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <Box sx={{ my: 3, display: 'flex', justifyContent: 'center' }}>
            <CircleProgress progress={progress} colorClass="eating">
              <Typography variant="caption" sx={{ color: 'hsl(150, 20%, 40%)', mb: 0.5 }}>
                {isComplete ? '식사 시간 종료!' : showElapsed ? '경과 시간' : '식사 종료까지'}
              </Typography>
              <Box
                component="button"
                onClick={() => setShowElapsed(prev => !prev)}
                sx={{
                  fontSize: '2.25rem',
                  fontWeight: 700,
                  color: 'hsl(150, 30%, 10%)',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                  bgcolor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'opacity 0.15s',
                  '&:active': { opacity: 0.6 },
                }}
              >
                {isComplete ? '00 : 00 : 00' : showElapsed ? elapsedFormatted : formatted}
              </Box>
              {!isComplete && (
                <Typography variant="caption" sx={{ color: 'hsl(150, 20%, 40%)', mt: 0.5, fontSize: '0.6875rem' }}>
                  {showElapsed
                    ? `시작: ${formatWallClock(new Date(eatingStart))}`
                    : `종료 예정: ${formatWallClock(new Date(eatingEnd))}`
                  }
                </Typography>
              )}
            </CircleProgress>
          </Box>
        </motion.div>

        {/* Next fasting info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Paper elevation={0} sx={{ bgcolor: 'hsl(145, 25%, 92%)', borderRadius: 4, p: 2.5, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40, height: 40,
                  borderRadius: 3,
                  bgcolor: 'rgba(20, 160, 80, 0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.125rem',
                }}
              >
                🌙
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={600} sx={{ color: 'hsl(150, 30%, 10%)' }}>
                  <Box component="span" sx={{ color: 'hsl(145, 55%, 42%)' }}>
                    {formatWallClock(new Date(eatingEnd))}
                  </Box>
                  {' '}단식 시작
                </Typography>
                <Typography variant="body2" sx={{ color: 'hsl(150, 20%, 40%)' }}>
                  {session.config.fastingHours}시간 단식 → {formatWallClockWithDay(nextFastingEnd)} 식사 가능
                </Typography>
              </Box>
            </Box>
          </Paper>
        </motion.div>

        {/* Commerce tip */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Paper elevation={0} sx={{ bgcolor: 'hsl(145, 25%, 92%)', borderRadius: 4, p: 2.5, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontSize: '1.5rem' }}>🥚</Typography>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={600} sx={{ color: 'hsl(150, 30%, 10%)' }}>
                  단식 시작 전, 마지막으로 챙겨 먹기 좋은 단백질 간식
                </Typography>
                <Typography variant="caption" sx={{ color: 'hsl(150, 20%, 40%)', mt: 0.25, display: 'block' }}>
                  포만감을 오래 유지해줘요
                </Typography>
              </Box>
            </Box>
          </Paper>
        </motion.div>
      </Box>

      {/* Bottom CTA */}
      <Box sx={{ width: '100%', pb: 4, pt: 2 }}>
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => onStartFasting()}
            size="large"
            sx={{
              borderRadius: 3,
              bgcolor: 'hsl(145, 55%, 42%)',
              '&:hover': { bgcolor: 'hsl(145, 55%, 36%)' },
            }}
          >
            지금 바로 단식 시작
          </Button>
        </motion.div>
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'hsl(150, 20%, 40%)', mt: 1.5 }}>
          식사를 일찍 마쳤다면 다음 사이클로 바로 진입하세요
        </Typography>
      </Box>
    </Box>
  );
}
