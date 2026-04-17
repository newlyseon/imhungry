import { useState } from 'react';
import { motion } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import LinearProgress from '@mui/material/LinearProgress';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
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

export function FastingScreen({ session, onEndFasting, onResetToSetup, onUpdateStartTime, getCurrentStage }: FastingScreenProps) {
  const [showNudge, setShowNudge] = useState(false);
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
  const [showElapsed, setShowElapsed] = useState(false);

  const remainingMs = Math.max(targetTime - Date.now(), 0);
  const remainingMin = Math.ceil(remainingMs / (1000 * 60));
  const remainingHours = Math.floor(remainingMin / 60);
  const remainingMinOnly = remainingMin % 60;
  const remainingText = remainingHours > 0 ? `${remainingHours}시간 ${remainingMinOnly}분` : `${remainingMinOnly}분`;

  // ── 시작 시간 편집 ──────────────────────────────────────────
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

  const openEditTime = () => {
    const d = new Date(session.fastingStartTime);
    setEditHour(d.getHours().toString().padStart(2, '0'));
    setEditMinute(d.getMinutes().toString().padStart(2, '0'));
    setShowEditTime(true);
  };

  const handleEndClick = () => {
    if (isComplete) { onEndFasting(); return; }
    setShowNudge(true);
  };

  // ── 색상 토큰 ───────────────────────────────────────────────
  const fastingText = 'rgba(255,255,255,0.95)';
  const fastingMuted = 'rgba(255,255,255,0.55)';
  const fastingAccent = 'hsl(158, 64%, 52%)';
  const fastingBg = 'rgba(255,255,255,0.08)';
  const fastingBorder = 'rgba(255,255,255,0.15)';
  const fastingHeavy = 'rgba(10,20,15,0.92)';

  // 하단 바 높이: 탭바 60px + 시작/종료 바 72px
  const BOTTOM_BAR_HEIGHT = 72;
  const TAB_BAR_HEIGHT = 60;

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* 배경 */}
      <Box sx={{ position: 'fixed', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }} />
      <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.55)', zIndex: 0 }} />

      {/* 스크롤 콘텐츠 */}
      <Box
        sx={{
          position: 'relative', zIndex: 1,
          flex: 1,
          overflowY: 'auto',
          px: '24px',
          pt: '52px',
          pb: `${BOTTOM_BAR_HEIGHT + TAB_BAR_HEIGHT + 16}px`,
        }}
      >
        {/* 타이틀 */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ mb: '32px' }}>
            <Typography sx={{ fontSize: '24px', fontWeight: 700, color: fastingText, lineHeight: '32px' }}>
              단식한지 {progressPercent}% 경과! <br />
            {currentStage?.description ?? '단식을 시작했어요'}
            </Typography>
          </Box>
        </motion.div>

        {/* 원형 타이머 */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: '28px' }}>
            <CircleProgress progress={progress} colorClass="fasting">
              <Typography sx={{ color: fastingMuted, mb: '4px', fontSize: '14px', fontWeight: 600 }}>
                {isComplete ? '목표 달성! 🎉' : showElapsed ? '지나간 시간' : '남은시간'}
              </Typography>
              <Box
                component="button"
                onClick={() => setShowElapsed(prev => !prev)}
                sx={{
                  fontSize: '2.25rem', fontWeight: 700, color: fastingAccent,
                  fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
                  bgcolor: 'transparent', border: 'none', cursor: 'pointer',
                  transition: 'opacity 0.15s', '&:active': { opacity: 0.6 },
                }}
              >
                {isComplete ? '00 : 00 : 00' : showElapsed ? elapsedFormatted : formatted}
              </Box>
              {!isComplete && (
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', mt: '6px', fontSize: '13px', textAlign: 'center' }}>
                  {showElapsed
                    ? `${formatWallClock(new Date(session.fastingStartTime))}에 시작했어요`
                    : `${formatWallClock(new Date(targetTime))}에 식사할 수 있어요`}
                </Typography>
              )}
            </CircleProgress>
          </Box>
        </motion.div>

        {/* 스테이지 바 */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Box
            sx={{
              bgcolor: fastingBg, backdropFilter: 'blur(12px)',
              p: '20px', borderRadius: '16px', border: `1px solid ${fastingBorder}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '4px', mb: '16px' }}>
              {FASTING_STAGES.map((stage, i) => {
                const elapsedHours = elapsedMs / (1000 * 60 * 60);
                const stageStart = stage.startHour;
                const stageEnd = i < FASTING_STAGES.length - 1 ? FASTING_STAGES[i + 1].startHour : session.config.fastingHours;
                const stageRange = stageEnd - stageStart;
                const stageFill = stageRange > 0
                  ? Math.min(Math.max((elapsedHours - stageStart) / stageRange, 0), 1)
                  : 0;
                const isActive = stageFill > 0;

                return (
                  <Box key={stage.name} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <LinearProgress
                      variant="determinate"
                      value={stageFill * 100}
                      sx={{
                        width: '100%', mb: '6px', borderRadius: '2px', height: '3px',
                        bgcolor: fastingBorder,
                        '& .MuiLinearProgress-bar': { bgcolor: fastingAccent, transition: 'transform 1s linear' },
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: '11px', textAlign: 'center', lineHeight: 1.3,
                        color: isActive ? fastingAccent : fastingMuted,
                        fontWeight: isActive ? 700 : 400,
                      }}
                    >
                      {stage.name}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </motion.div>
      </Box>

      {/* 하단 시작/종료 바 (탭바 위에 고정) */}
      <Box
        sx={{
          position: 'fixed',
          bottom: `${TAB_BAR_HEIGHT}px`,
          left: 0, right: 0,
          zIndex: 10,
          bgcolor: fastingHeavy,
          backdropFilter: 'blur(20px)',
          borderTop: `1px solid ${fastingBorder}`,
          height: `${BOTTOM_BAR_HEIGHT}px`,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* 시작 */}
        <Box
          onClick={openEditTime}
          sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', py: '12px' }}
        >
          <Typography sx={{ fontSize: '12px', color: fastingMuted, mb: '4px', fontWeight: 600 }}>시작</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Typography sx={{ fontSize: '16px', fontWeight: 700, color: fastingText }}>
              {formatWallClock(new Date(session.fastingStartTime))}
            </Typography>
            <EditRoundedIcon sx={{ fontSize: '13px', color: fastingMuted }} />
          </Box>
        </Box>

        {/* 구분선 */}
        <Box sx={{ width: '1px', height: '32px', bgcolor: fastingBorder }} />

        {/* 종료 */}
        <Box
          onClick={handleEndClick}
          sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', py: '12px' }}
        >
          <Typography sx={{ fontSize: '12px', color: fastingMuted, mb: '4px', fontWeight: 600 }}>종료</Typography>
          <Typography sx={{ fontSize: '16px', fontWeight: 700, color: isComplete ? fastingAccent : fastingText }}>
            {formatWallClock(new Date(targetTime))}
          </Typography>
        </Box>
      </Box>

      {/* 시작 시간 수정 Drawer */}
      <Drawer
        anchor="bottom"
        open={showEditTime}
        onClose={() => setShowEditTime(false)}
        slotProps={{
          paper: { sx: { borderRadius: '24px 24px 0 0', px: '24px', pb: '40px', pt: '24px', bgcolor: fastingHeavy, backdropFilter: 'blur(24px)' } },
        }}
      >
        <Typography sx={{ fontSize: '18px', fontWeight: 700, color: fastingText, mb: '4px' }}>시작 시간 수정</Typography>
        <Typography sx={{ fontSize: '14px', color: fastingMuted, mb: '24px' }}>
          단식 시작 시간은 현재 시간 이전으로만 설정할 수 있어요.
        </Typography>

        <ToggleButtonGroup exclusive value={editDay} onChange={(_, v) => v && setEditDay(v)} fullWidth sx={{ mb: '16px' }}>
          {(['today', 'yesterday'] as const).map((val) => (
            <ToggleButton
              key={val} value={val}
              sx={{
                flex: 1, py: '12px', color: fastingMuted, border: `1px solid ${fastingBorder}`,
                '&.Mui-selected': { bgcolor: fastingBg, color: fastingText, border: `1px solid rgba(255,255,255,0.3)` },
              }}
            >
              {val === 'today' ? '오늘' : '어제'}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', mb: '16px' }}>
          <FormControl>
            <Select
              value={isHourValid ? editHour : ''} onChange={(e) => setEditHour(e.target.value)}
              displayEmpty
              sx={{ width: 96, height: 56, textAlign: 'center', fontWeight: 700, fontSize: '1.25rem', color: fastingText, bgcolor: fastingBg, '.MuiOutlinedInput-notchedOutline': { borderColor: fastingBorder }, '.MuiSvgIcon-root': { color: fastingMuted } }}
              renderValue={(v) => v || '--'}
            >
              {availableHours.map(i => { const label = i.toString().padStart(2, '0'); return <MenuItem key={i} value={label}>{label}시</MenuItem>; })}
            </Select>
          </FormControl>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: fastingText }}>:</Typography>
          <FormControl>
            <Select
              value={isMinuteValid ? editMinute : ''} onChange={(e) => setEditMinute(e.target.value)}
              displayEmpty
              sx={{ width: 96, height: 56, textAlign: 'center', fontWeight: 700, fontSize: '1.25rem', color: fastingText, bgcolor: fastingBg, '.MuiOutlinedInput-notchedOutline': { borderColor: fastingBorder }, '.MuiSvgIcon-root': { color: fastingMuted } }}
              renderValue={(v) => v || '--'}
            >
              {availableMinutes.map(m => { const val = m.toString().padStart(2, '0'); return <MenuItem key={m} value={val}>{val}분</MenuItem>; })}
            </Select>
          </FormControl>
        </Box>

        <Button
          variant="outlined" fullWidth size="large"
          onClick={handleSaveStartTime}
          disabled={!isHourValid || !isMinuteValid}
          sx={{
            borderRadius: '12px', border: `1px solid ${fastingBorder}`, color: 'white', bgcolor: fastingBg,
            '&&': { height: '50px' },
            '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', border: `1px solid ${fastingBorder}` },
            '&.Mui-disabled': { opacity: 0.4, color: 'white', border: `1px solid ${fastingBorder}` },
          }}
        >
          저장
        </Button>
      </Drawer>

      {/* 종료 확인 Drawer */}
      <Drawer
        anchor="bottom"
        open={showNudge && !isComplete}
        onClose={() => setShowNudge(false)}
        slotProps={{
          paper: { sx: { borderRadius: '24px 24px 0 0', px: '24px', pb: '40px', pt: '24px', bgcolor: fastingHeavy, backdropFilter: 'blur(24px)' } },
        }}
      >
        <Typography sx={{ fontSize: '18px', fontWeight: 700, color: fastingText, mb: '4px' }}>
          목표까지{' '}
          <Box component="span" sx={{ color: fastingAccent }}>{remainingText}</Box>
          {' '}남았어요
        </Typography>
        <Typography sx={{ fontSize: '14px', color: fastingMuted, mb: '24px' }}>
          조금만 더 하면 {FASTING_STAGES[Math.min(currentStageIndex + 1, FASTING_STAGES.length - 1)].name} 단계예요! 💪
        </Typography>
        <Box sx={{ display: 'flex', gap: '12px' }}>
          <Button
            variant="outlined" size="large"
            onClick={() => setShowNudge(false)}
            sx={{ flex: 1, borderRadius: '12px', border: `1px solid ${fastingBorder}`, color: 'white', bgcolor: fastingBg, '&&': { height: '50px' }, '&:hover': { bgcolor: 'rgba(255,255,255,0.15)', border: `1px solid ${fastingBorder}` } }}
          >
            계속 할게요
          </Button>
          <Button
            variant="text" size="large"
            onClick={() => { onResetToSetup(); setShowNudge(false); }}
            sx={{ flex: 1, borderRadius: '12px', border: `1px solid ${fastingBorder}`, color: fastingMuted, '&&': { height: '50px' }, '&:hover': { bgcolor: 'transparent', color: fastingText } }}
          >
            그래도 종료
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
}
