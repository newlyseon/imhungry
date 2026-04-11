import { useState } from 'react';
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
import LinearProgress from '@mui/material/LinearProgress';
import { CircleProgress } from '@/components/CircleProgress';
import { useCountdown, useElapsed } from '@/hooks/useCountdown';
import { FastingSession, FASTING_STAGES, FastingStage } from '@/hooks/useFastingStore';
import { formatWallClock, formatTimerDisplay } from '@/lib/formatTime';

import fastingBg1 from '@/assets/fasting-bg-1.png';
import fastingBg2 from '@/assets/fasting-bg-2.png';

const FASTING_BGS = [fastingBg1, fastingBg2];

interface FastingScreenProps {
  session: FastingSession;
  onEndFasting: () => void;
  onResetToSetup: () => void;
  onGoHome: () => void;
  onUpdateStartTime: (newStartTime: Date) => void;
  getCurrentStage: () => FastingStage | null;
}

export function FastingScreen({ session, onEndFasting, onResetToSetup, onGoHome, onUpdateStartTime, getCurrentStage }: FastingScreenProps) {
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

  // Fasting mode colors
  const fastingText = 'rgba(255,255,255,0.95)';
  const fastingMuted = 'rgba(255,255,255,0.55)';
  const fastingAccent = 'hsl(158, 64%, 52%)';
  const fastingBg = 'rgba(255,255,255,0.08)';
  const fastingBorder = 'rgba(255,255,255,0.15)';
  const fastingHeavy = 'rgba(10,20,15,0.92)';

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', position: 'relative' }}>
      {/* Background */}
      <Box
        sx={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Dark overlay */}
      <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.55)' }} />

      {/* Content */}
      <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', px: 2.5, pt: 4 }}>
        <Box sx={{ flex: 1, width: '100%', overflowY: 'auto' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 6 }}>
              <Box>
                <Typography variant="h5" fontWeight={700} sx={{ color: fastingText }}>단식 중 🌙</Typography>
                <Typography variant="body2" sx={{ color: fastingMuted, mt: 0.5 }}>
                  {session.config.type === 'custom' ? `${session.config.fastingHours}:${session.config.eatingHours}` : session.config.type} · {progressPercent}% 완료
                </Typography>
              </Box>
              <Box
                component="button"
                onClick={onGoHome}
                sx={{ bgcolor: 'transparent', border: 'none', cursor: 'pointer', color: fastingMuted, fontSize: '14px', fontWeight: 600, pt: '4px' }}
              >
                홈으로
              </Box>
            </Box>
          </motion.div>

          {/* Circle */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <Box sx={{ my: 4, display: 'flex', justifyContent: 'center' }}>
              <CircleProgress progress={progress} colorClass="fasting">
                <Typography sx={{ color: 'white', mb: 0.5, fontSize: '1.125rem', fontWeight: 700, bgcolor: 'transparent' }}>
                  {isComplete ? '목표 달성! 🎉' : showElapsed ? '지나간 시간' : '남은시간'}
                </Typography>
                <Box
                  component="button"
                  onClick={() => setShowElapsed(prev => !prev)}
                  sx={{
                    fontSize: '2.25rem',
                    fontWeight: 700,
                    color: fastingAccent,
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
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.75, fontSize: '0.875rem' }}>
                    {showElapsed
                      ? `${formatWallClock(new Date(session.fastingStartTime))}에 시작했어요`
                      : `${formatWallClock(new Date(targetTime))}에 식사할 수 있어요`
                    }
                  </Typography>
                )}
              </CircleProgress>
            </Box>
          </motion.div>

          {/* Stage stepper */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Box
              sx={{
                width: '100%',
                bgcolor: fastingBg,
                backdropFilter: 'blur(12px)',
                p: 2.5,
                mb: 2,
                borderRadius: 3,
                border: `1px solid ${fastingBorder}`,
              }}
            >
              <Typography variant="body2" fontWeight={600} sx={{ color: fastingText, mb: 2 }}>현재 내 몸의 변화</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 3 }}>
                {FASTING_STAGES.map((stage, i) => {
                  const elapsedHours = elapsedMs / (1000 * 60 * 60);
                  const stageStart = stage.startHour;
                  const stageEnd = i < FASTING_STAGES.length - 1 ? FASTING_STAGES[i + 1].startHour : session.config.fastingHours;
                  const stageRange = stageEnd - stageStart;
                  const stageFill = stageRange > 0
                    ? Math.min(Math.max((elapsedHours - stageStart) / stageRange, 0), 1)
                    : 0;

                  return (
                    <Box key={stage.name} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <LinearProgress
                        variant="determinate"
                        value={stageFill * 100}
                        sx={{
                          width: '100%',
                          mb: 1,
                          bgcolor: fastingBorder,
                          '& .MuiLinearProgress-bar': {
                            bgcolor: fastingAccent,
                            transition: 'transform 1s linear',
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.6875rem',
                          textAlign: 'center',
                          lineHeight: 1.2,
                          color: stageFill > 0 ? fastingAccent : fastingMuted,
                        }}
                      >
                        {stage.name}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
              {currentStage && (
                <motion.div key={currentStage.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Typography variant="body2" sx={{ color: fastingText, textAlign: 'center' }}>
                    {currentStage.description}
                  </Typography>
                </motion.div>
              )}
            </Box>
          </motion.div>
        </Box>

        {/* Bottom actions */}
        <Box sx={{ width: '100%', pb: 4, pt: 2 }}>
          {!showNudge && (
            <>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  onClick={onResetToSetup}
                  size="large"
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${fastingBorder}`,
                    color: fastingMuted,
                    bgcolor: 'transparent',
                    fontWeight: 600,
                    flexShrink: 0,
                    px: 3,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', border: `1px solid ${fastingBorder}` },
                  }}
                >
                  취소
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleEndClick}
                  size="large"
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${fastingBorder}`,
                    color: 'white',
                    bgcolor: fastingBg,
                    backdropFilter: 'blur(12px)',
                    fontWeight: 600,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', border: `1px solid ${fastingBorder}` },
                  }}
                >
                  단식 종료
                </Button>
              </Box>
              <Button
                variant="text"
                fullWidth
                onClick={() => {
                  const d = new Date(session.fastingStartTime);
                  setEditHour(d.getHours().toString().padStart(2, '0'));
                  setEditMinute(d.getMinutes().toString().padStart(2, '0'));
                  setShowEditTime(true);
                }}
                sx={{ mt: 1, color: fastingMuted, fontSize: '0.875rem', '&:hover': { color: 'white', bgcolor: 'transparent' } }}
              >
                시작 시간 수정하기
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Edit start time drawer */}
      <Drawer
        anchor="bottom"
        open={showEditTime}
        onClose={() => setShowEditTime(false)}
        PaperProps={{
          sx: {
            borderRadius: '24px 24px 0 0',
            px: 2.5,
            pb: 4,
            pt: 3,
            bgcolor: fastingHeavy,
            backdropFilter: 'blur(24px)',
          },
        }}
      >
        <Typography variant="h6" fontWeight={700} sx={{ color: fastingText, mb: 0.5 }}>시작 시간 수정</Typography>
        <Typography variant="body2" sx={{ color: fastingMuted, mb: 2.5 }}>
          단식 시작시간은 현재시간 이전으로만 설정할 수 있어요.
        </Typography>

        <ToggleButtonGroup
          exclusive
          value={editDay}
          onChange={(_, v) => v && setEditDay(v)}
          fullWidth
          sx={{ mb: 2 }}
        >
          {['today', 'yesterday'].map((val) => (
            <ToggleButton
              key={val}
              value={val}
              sx={{
                flex: 1, py: 1.5,
                color: fastingMuted,
                border: `1px solid ${fastingBorder}`,
                '&.Mui-selected': {
                  bgcolor: fastingBg,
                  color: fastingText,
                  border: `1px solid rgba(255,255,255,0.3)`,
                },
              }}
            >
              {val === 'today' ? '오늘' : '어제'}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2, py: 1 }}>
          <FormControl>
            <Select
              value={isHourValid ? editHour : ''}
              onChange={(e) => setEditHour(e.target.value)}
              displayEmpty
              sx={{
                width: 96, height: 56,
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '1.25rem',
                color: fastingText,
                bgcolor: fastingBg,
                '.MuiOutlinedInput-notchedOutline': { borderColor: fastingBorder },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                '.MuiSvgIcon-root': { color: fastingMuted },
              }}
              renderValue={(v) => v || '--'}
            >
              {availableHours.map(i => {
                const label = i.toString().padStart(2, '0');
                return <MenuItem key={i} value={label}>{label}시</MenuItem>;
              })}
            </Select>
          </FormControl>
          <Typography variant="h5" fontWeight={700} sx={{ color: fastingText }}>:</Typography>
          <FormControl>
            <Select
              value={isMinuteValid ? editMinute : ''}
              onChange={(e) => setEditMinute(e.target.value)}
              displayEmpty
              sx={{
                width: 96, height: 56,
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '1.25rem',
                color: fastingText,
                bgcolor: fastingBg,
                '.MuiOutlinedInput-notchedOutline': { borderColor: fastingBorder },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                '.MuiSvgIcon-root': { color: fastingMuted },
              }}
              renderValue={(v) => v || '--'}
            >
              {availableMinutes.map(m => {
                const val = m.toString().padStart(2, '0');
                return <MenuItem key={m} value={val}>{val}분</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Box>

        {isHourValid && isMinuteValid && (
          <Typography variant="body2" fontWeight={600} sx={{ color: fastingAccent, textAlign: 'center', mb: 2 }}>
            {editHour}시 {editMinute}분
          </Typography>
        )}

        <Button
          variant="outlined"
          fullWidth
          onClick={handleSaveStartTime}
          disabled={!isHourValid || !isMinuteValid}
          size="large"
          sx={{
            borderRadius: 3,
            border: `1px solid ${fastingBorder}`,
            color: 'white',
            bgcolor: fastingBg,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', border: `1px solid ${fastingBorder}` },
            '&.Mui-disabled': { opacity: 0.4, color: 'white', border: `1px solid ${fastingBorder}` },
          }}
        >
          저장
        </Button>
      </Drawer>

      {/* Nudge drawer */}
      <Drawer
        anchor="bottom"
        open={showNudge && !isComplete}
        onClose={() => setShowNudge(false)}
        PaperProps={{
          sx: {
            borderRadius: '24px 24px 0 0',
            px: 2.5,
            pb: 4,
            pt: 3,
            bgcolor: fastingHeavy,
            backdropFilter: 'blur(24px)',
          },
        }}
      >
        <Typography variant="h6" fontWeight={700} sx={{ color: fastingText, mb: 0.5 }}>
          목표까지{' '}
          <Box component="span" sx={{ color: fastingAccent }}>{remainingText}</Box>
          {' '}남았습니다
        </Typography>
        <Typography variant="body2" sx={{ color: fastingMuted, mb: 2.5 }}>
          조금만 더 하면 {FASTING_STAGES[Math.min(currentStageIndex + 1, FASTING_STAGES.length - 1)].name} 단계예요! 💪
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            sx={{
              flex: 1, borderRadius: 3,
              border: `1px solid ${fastingBorder}`,
              color: 'white',
              bgcolor: fastingBg,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', border: `1px solid ${fastingBorder}` },
            }}
            size="large"
            onClick={() => setShowNudge(false)}
          >
            계속 할게요
          </Button>
          <Button
            variant="text"
            sx={{
              flex: 1, borderRadius: 3,
              border: `1px solid ${fastingBorder}`,
              color: fastingMuted,
              '&:hover': { bgcolor: 'transparent', color: fastingText },
            }}
            size="large"
            onClick={onEndFasting}
          >
            그래도 종료
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
}
