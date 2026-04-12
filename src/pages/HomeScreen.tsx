import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FormControl from '@mui/material/FormControl';
import LinearProgress from '@mui/material/LinearProgress';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CloseIcon from '@mui/icons-material/Close';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { CircleProgress } from '@/components/CircleProgress';
import { useCountdown, useElapsed } from '@/hooks/useCountdown';
import {
  FastingConfig, FastingType, FastingSession, AppPhase,
  FASTING_PRESETS, FASTING_STAGES, FastingStage, SessionRecord,
} from '@/hooks/useFastingStore';
import { formatWallClock, formatWallClockWithDay, formatTimerDisplay } from '@/lib/formatTime';

import fastingBg1 from '@/assets/fasting-bg-1.png';
import fastingBg2 from '@/assets/fasting-bg-2.png';

const FASTING_BGS = [fastingBg1, fastingBg2];

// ── 디자인 토큰 (홈 모드) ────────────────────────────────────
const PRIMARY = '#00498D';
const PRIMARY_DARK = '#003A70';
const PRIMARY_BTN = '#1A5FAD';
const CARD_SHADOW = '0px 7px 14px -6px rgba(0,0,0,0.08)';
const SUB_COLOR = '#9FABB7';

// ── 디자인 토큰 (단식 모드) ──────────────────────────────────
const F_TEXT = 'rgba(255,255,255,0.95)';
const F_MUTED = 'rgba(255,255,255,0.55)';
const F_ACCENT = '#309EFF';
const F_BG = 'rgba(255,255,255,0.08)';
const F_BORDER = 'rgba(255,255,255,0.15)';


const ALL_TYPES: Exclude<FastingType, 'custom'>[] = ['12:12', '13:11', '14:10', '16:8', '18:6', '20:4'];
const TAB_BAR_HEIGHT = 80;
const BOTTOM_BAR_HEIGHT = 72;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return '좋은 아침이에요.';
  if (h >= 12 && h < 18) return '좋은 오후에요.';
  if (h >= 18 && h < 22) return '좋은 저녁이에요.';
  return '안녕하세요.';
}

function formatEndTime(fastingHours: number): string {
  const end = new Date(Date.now() + fastingHours * 60 * 60 * 1000);
  const isToday = end.getDate() === new Date().getDate();
  const h = end.getHours();
  const m = end.getMinutes();
  const ampm = h < 12 ? '오전' : '오후';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m > 0 ? ` ${m}분` : '';
  return `${isToday ? '오늘' : '내일'} ${ampm} ${displayH}시${displayM}에 종료돼요`;
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ py: '20px', borderRadius: '16px', bgcolor: 'white', boxShadow: CARD_SHADOW }}>
      <Box sx={{ mx: '24px' }}>{children}</Box>
    </Box>
  );
}

// ── Props ────────────────────────────────────────────────────
export interface HomeScreenProps {
  currentPhase: AppPhase;
  currentSession: FastingSession | null;
  totalCompletedSessions: number;
  statusMessage?: string;
  recentHistory: SessionRecord[];
  onStartFastingDirect: (config: FastingConfig) => void;
  onStartFastingFromPast: (config: FastingConfig, startTime: Date) => void;
  onReserveFasting: (config: FastingConfig, scheduledStart: Date) => void;
  onEndFasting: () => void;
  onResetToSetup: () => void;
  onUpdateStartTime: (newStartTime: Date) => void;
  getCurrentStage: () => FastingStage | null;
}

// ────────────────────────────────────────────────────────────
// 단식 모드
// ────────────────────────────────────────────────────────────
function FastingMode({
  session, onEndFasting, onResetToSetup, onUpdateStartTime, getCurrentStage,
}: {
  session: FastingSession;
  onEndFasting: () => void;
  onResetToSetup: () => void;
  onUpdateStartTime: (d: Date) => void;
  getCurrentStage: () => FastingStage | null;
}) {
  const [showElapsed, setShowElapsed] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [showEditTime, setShowEditTime] = useState(false);

  const bgImage = FASTING_BGS[Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % FASTING_BGS.length];
  const targetTime = session.fastingStartTime + session.config.fastingHours * 60 * 60 * 1000;
  const { formatted, isComplete } = useCountdown(targetTime);
  const { elapsedMs } = useElapsed(session.fastingStartTime);

  const progress = Math.min(elapsedMs / (session.config.fastingHours * 60 * 60 * 1000), 1);
  const progressPercent = Math.round(progress * 100);
  const currentStage = getCurrentStage();
  const currentStageIndex = currentStage
    ? FASTING_STAGES.findIndex(s => s.name === currentStage.name)
    : 0;

  const remainingMs = Math.max(targetTime - Date.now(), 0);
  const remainingMin = Math.ceil(remainingMs / (1000 * 60));
  const remainingText = remainingMin >= 60
    ? `${Math.floor(remainingMin / 60)}시간 ${remainingMin % 60}분`
    : `${remainingMin}분`;

  // 시작 시간 편집 state
  const startDate = new Date(session.fastingStartTime);
  const [editDay, setEditDay] = useState<'today' | 'yesterday'>(() =>
    startDate.toDateString() === new Date().toDateString() ? 'today' : 'yesterday'
  );
  const [editHour, setEditHour] = useState(startDate.getHours().toString().padStart(2, '0'));
  const [editMinute, setEditMinute] = useState(startDate.getMinutes().toString().padStart(2, '0'));

  const now = new Date();
  const availableHours = editDay === 'yesterday'
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: now.getHours() + 1 }, (_, i) => i);
  const availableMinutes = (editDay === 'today' && parseInt(editHour) === now.getHours())
    ? Array.from({ length: 12 }, (_, i) => i * 5).filter(m => m <= now.getMinutes())
    : Array.from({ length: 12 }, (_, i) => i * 5);
  const isHourValid = availableHours.includes(parseInt(editHour));
  const isMinuteValid = availableMinutes.includes(parseInt(editMinute));

  const openEditTime = () => {
    const d = new Date(session.fastingStartTime);
    setEditHour(d.getHours().toString().padStart(2, '0'));
    setEditMinute(d.getMinutes().toString().padStart(2, '0'));
    setShowEditTime(true);
  };

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

  return (
    <>
      {/* 배경 */}
      <Box sx={{ position: 'fixed', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }} />
      <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(17,29,41,0.85)', zIndex: 0 }} />

      {/* 스크롤 콘텐츠 */}
      <Box
        sx={{
          position: 'relative', zIndex: 1,
          overflowY: 'auto',
          px: '24px', pt: '70px',
          pb: `${BOTTOM_BAR_HEIGHT + TAB_BAR_HEIGHT + 16}px`,
        }}
      >
        {/* 타이틀 */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ mb: '40px' }}>
            <Typography sx={{ fontSize: '24px', fontWeight: 700, lineHeight: '32px', color: F_TEXT }}>
              단식한지 {progressPercent}% 경과!
            </Typography>
            <Typography sx={{ fontSize: '24px', fontWeight: 700, lineHeight: '32px', color: F_TEXT }}>
              {currentStage?.description ?? '단식을 시작했어요'}
            </Typography>
          </Box>
        </motion.div>

        {/* 원형 타이머 */}
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: '24px' }}>
            <CircleProgress progress={progress} colorClass="fasting">
              <Typography sx={{ color: F_TEXT, mb: '4px', fontSize: '20px', fontWeight: 600 }}>
                {isComplete ? '목표 달성! 🎉' : showElapsed ? '지나간 시간' : '남은시간'}
              </Typography>
              <Box
                component="button"
                onClick={() => setShowElapsed(p => !p)}
                sx={{ fontSize: '2.25rem', fontWeight: 700, color: F_ACCENT, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', bgcolor: 'transparent', border: 'none', cursor: 'pointer', transition: 'opacity 0.15s', '&:active': { opacity: 0.6 } }}
              >
                {isComplete ? '00 : 00 : 00' : showElapsed ? formatTimerDisplay(elapsedMs) : formatted}
              </Box>
              {!isComplete && (
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', mt: '6px', fontSize: '15px', textAlign: 'center' }}>
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
          <Box sx={{ bgcolor: F_BG, backdropFilter: 'blur(12px)', borderRadius: '16px', border: `1px solid ${F_BORDER}`, height: '80px', display: 'flex', alignItems: 'center', px: '20px' }}>
            <Box sx={{ display: 'flex', gap: '4px', width: '100%', alignItems: 'center' }}>
              {FASTING_STAGES.map((stage, i) => {
                const elapsedHours = elapsedMs / (1000 * 60 * 60);
                const stageEnd = i < FASTING_STAGES.length - 1 ? FASTING_STAGES[i + 1].startHour : session.config.fastingHours;
                const stageFill = Math.min(Math.max((elapsedHours - stage.startHour) / (stageEnd - stage.startHour), 0), 1);
                return (
                  <Box key={stage.name} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <LinearProgress variant="determinate" value={stageFill * 100}
                      sx={{ width: '100%', mb: '8px', borderRadius: '4px', height: '8px', bgcolor: F_BORDER, '& .MuiLinearProgress-bar': { bgcolor: F_ACCENT, transition: 'transform 1s linear' } }}
                    />
                    <Typography sx={{ fontSize: '10px', textAlign: 'center', lineHeight: 1.3, color: stageFill > 0 ? F_ACCENT : F_MUTED, fontWeight: stageFill > 0 ? 700 : 400 }}>
                      {stage.name}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </motion.div>
      </Box>

      {/* 하단 시작/종료 바 (탭바 위 고정) */}
      <Box
        sx={{
          position: 'fixed', bottom: `${TAB_BAR_HEIGHT}px`, left: 0, right: 0, zIndex: 10,
          height: `90x`,
          display: 'flex', alignItems: 'center',
        }}
      >
        <Box onClick={openEditTime} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', py: '48px' }}>
          <Typography sx={{ fontSize: '15px', color: '#ffffff', mb: '4px', fontWeight: 800 }}>시작</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Typography sx={{ fontSize: '15px', fontWeight: 400, color: 'rgba(255,255,255,0.6)' }}>
              {formatWallClock(new Date(session.fastingStartTime))}
            </Typography>
            <EditRoundedIcon sx={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)' }} />
          </Box>
        </Box>
        <Box sx={{ width: '1px', height: '40px', bgcolor: F_BORDER }} />
        <Box
          onClick={() => isComplete ? onEndFasting() : setShowNudge(true)}
          sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', py: '48px' }}
        >
          <Typography sx={{ fontSize: '15px', color: '#ffffff', mb: '4px', fontWeight: 800 }}>종료</Typography>
          <Typography sx={{ fontSize: '15px', fontWeight: 400, color: isComplete ? F_ACCENT : 'rgba(255,255,255,0.6)' }}>
            {formatWallClock(new Date(targetTime))}
          </Typography>
        </Box>
      </Box>

      {/* 시작 시간 수정 Drawer */}
      <Drawer anchor="bottom" open={showEditTime} onClose={() => setShowEditTime(false)}
        slotProps={{ paper: { sx: { borderRadius: '24px 24px 0 0', px: '24px', pb: '40px', pt: '24px', bgcolor: 'white' } } }}
      >
        <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#000', mb: '4px' }}>시작 시간 수정</Typography>
        <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '24px' }}>단식 시작 시간은 현재 시간 이전으로만 설정할 수 있어요.</Typography>
        <ToggleButtonGroup exclusive value={editDay} onChange={(_, v) => v && setEditDay(v)} fullWidth sx={{ mb: '16px' }}>
          {(['today', 'yesterday'] as const).map(val => (
            <ToggleButton key={val} value={val} sx={{ flex: 1, py: '12px' }}>
              {val === 'today' ? '오늘' : '어제'}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', mb: '16px' }}>
          <FormControl>
            <Select value={isHourValid ? editHour : ''} onChange={e => setEditHour(e.target.value)} displayEmpty
              sx={{ width: 96, height: 56, textAlign: 'center', fontWeight: 700, fontSize: '1.25rem' }}
              renderValue={v => v || '--'}
              MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
            >
              {availableHours.map(i => { const l = i.toString().padStart(2, '0'); return <MenuItem key={i} value={l}>{l}시</MenuItem>; })}
            </Select>
          </FormControl>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#000' }}>:</Typography>
          <FormControl>
            <Select value={isMinuteValid ? editMinute : ''} onChange={e => setEditMinute(e.target.value)} displayEmpty
              sx={{ width: 96, height: 56, textAlign: 'center', fontWeight: 700, fontSize: '1.25rem' }}
              renderValue={v => v || '--'}
              MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
            >
              {availableMinutes.map(m => { const v = m.toString().padStart(2, '0'); return <MenuItem key={m} value={v}>{v}분</MenuItem>; })}
            </Select>
          </FormControl>
        </Box>
        <Button variant="contained" fullWidth size="large" onClick={handleSaveStartTime} disabled={!isHourValid || !isMinuteValid}
          sx={{ borderRadius: '12px' }}
        >
          저장
        </Button>
      </Drawer>

      {/* 종료 확인 Drawer */}
      <Drawer anchor="bottom" open={showNudge && !isComplete} onClose={() => setShowNudge(false)}
        slotProps={{ paper: { sx: { borderRadius: '24px 24px 0 0', px: '24px', pb: '40px', pt: '24px', bgcolor: 'white' } } }}
      >
        <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#000', mb: '4px' }}>
          목표까지 <Box component="span" sx={{ color: PRIMARY }}>{remainingText}</Box> 남았어요
        </Typography>
        <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '24px' }}>
          조금만 더 하면 {FASTING_STAGES[Math.min(currentStageIndex + 1, FASTING_STAGES.length - 1)].name} 단계예요! 💪
        </Typography>
        <Box sx={{ display: 'flex', gap: '12px' }}>
          <Button variant="contained" size="large" onClick={() => setShowNudge(false)}
            sx={{ flex: 1, borderRadius: '12px' }}
          >계속 할게요</Button>
          <Button variant="outlined" size="large" onClick={() => { onResetToSetup(); setShowNudge(false); }}
            sx={{ flex: 1, borderRadius: '12px' }}
          >그래도 종료</Button>
        </Box>
      </Drawer>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// 홈 모드
// ────────────────────────────────────────────────────────────
function HomeMode({
  totalCompletedSessions, statusMessage,
  onStartFastingDirect, onStartFastingFromPast, onReserveFasting,
}: {
  totalCompletedSessions: number;
  statusMessage?: string;
  onStartFastingDirect: (config: FastingConfig) => void;
  onStartFastingFromPast: (config: FastingConfig, startTime: Date) => void;
  onReserveFasting: (config: FastingConfig, scheduledStart: Date) => void;
}) {
  const [selectedType, setSelectedType] = useState<Exclude<FastingType, 'custom'>>('16:8');
  const config = FASTING_PRESETS[selectedType];

  const now = new Date();
  const allMinutes = Array.from({ length: 12 }, (_, i) => i * 5);

  // 빠른 시작 drawer
  const [quickOpen, setQuickOpen] = useState(false);
  const [quickStep, setQuickStep] = useState(1);
  const [pastChoice, setPastChoice] = useState<'now' | 'pick' | null>(null);
  const [pastDay, setPastDay] = useState<'today' | 'yesterday'>('today');
  const [pastHour, setPastHour] = useState('');
  const [pastMinute, setPastMinute] = useState('00');

  const pastAvailableHours = pastDay === 'yesterday'
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: now.getHours() + 1 }, (_, i) => i);
  const pastAvailableMinutes = (pastDay === 'today' && parseInt(pastHour) === now.getHours())
    ? allMinutes.filter(m => m <= now.getMinutes())
    : allMinutes;
  const isPastHourValid = pastAvailableHours.includes(parseInt(pastHour));
  const isPastMinuteValid = pastAvailableMinutes.includes(parseInt(pastMinute));

  const pastStartDate = useMemo(() => {
    if (!isPastHourValid || !isPastMinuteValid) return null;
    const d = new Date();
    if (pastDay === 'yesterday') d.setDate(d.getDate() - 1);
    d.setHours(parseInt(pastHour), parseInt(pastMinute), 0, 0);
    return d;
  }, [pastHour, pastMinute, pastDay, isPastHourValid, isPastMinuteValid]);

  const elapsedPreview = useMemo(() => {
    if (!pastStartDate) return null;
    const ms = Date.now() - pastStartDate.getTime();
    return { h: Math.floor(ms / (1000 * 60 * 60)), m: Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60)) };
  }, [pastStartDate]);

  const closeQuick = () => { setQuickOpen(false); setQuickStep(1); setPastChoice(null); };

  // 예약 drawer
  const [reserveOpen, setReserveOpen] = useState(false);
  const [reserveStep, setReserveStep] = useState(1);
  const [reserveType, setReserveType] = useState<Exclude<FastingType, 'custom'>>('16:8');
  const reserveConfig = FASTING_PRESETS[reserveType];
  const [mealEndHour, setMealEndHour] = useState('');
  const [mealEndMinute, setMealEndMinute] = useState('00');

  const flowAHours = Array.from({ length: 24 }, (_, i) => i).filter(i => i >= now.getHours());
  const flowAMinutes = parseInt(mealEndHour) === now.getHours()
    ? allMinutes.filter(m => m > now.getMinutes())
    : allMinutes;
  const isMealEndHourValid = flowAHours.includes(parseInt(mealEndHour));
  const isMealEndMinuteValid = flowAMinutes.includes(parseInt(mealEndMinute));

  const mealEndDate = useMemo(() => {
    if (!isMealEndHourValid || !isMealEndMinuteValid) return null;
    const d = new Date();
    d.setHours(parseInt(mealEndHour), parseInt(mealEndMinute), 0, 0);
    return d;
  }, [mealEndHour, mealEndMinute, isMealEndHourValid, isMealEndMinuteValid]);

  const reserveNextMeal = useMemo(() => {
    if (!mealEndDate) return null;
    return new Date(mealEndDate.getTime() + reserveConfig.fastingHours * 60 * 60 * 1000);
  }, [mealEndDate, reserveConfig]);

  const closeReserve = () => { setReserveOpen(false); setReserveStep(1); };

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', px: '24px', pt: '44px', pb: '100px' }}>
      {/* 헤더 */}
      <Box sx={{ mb: '32px' }}>
        <Typography sx={{ fontSize: '24px', fontWeight: 700, lineHeight: '32px', color: '#000' }}>
          {getGreeting()}
        </Typography>
        <Typography sx={{ fontSize: '24px', fontWeight: 700, lineHeight: '32px', color: '#000' }}>
          오늘부터{' '}
          <Box component="span" sx={{ color: PRIMARY }}>{totalCompletedSessions + 1}일!</Box>
          {' '}함께 시작해요.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* 결과 메시지 카드 */}
        {statusMessage && (
          <Box sx={{ p: '20px', borderRadius: '16px', bgcolor: '#1F2327' }}>
            <Typography sx={{ fontSize: '15px', fontWeight: 600, color: 'white' }}>{statusMessage}</Typography>
          </Box>
        )}
        {/* 바로 시작 카드 (파란 배경) */}
        <Box sx={{ borderRadius: '20px', bgcolor: PRIMARY, boxShadow: CARD_SHADOW, p: '20px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '16px' }}>
            <Box
              onClick={e => {
                const select = (e.currentTarget as HTMLElement).querySelector('select');
                select?.click();
              }}
              sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}
            >
              <Typography sx={{ fontSize: '24px', fontWeight: 800, color: 'white', lineHeight: 1 }}>
                {selectedType}
              </Typography>
              <KeyboardArrowDownRoundedIcon sx={{ fontSize: '20px', color: 'white', mt: '1px' }} />
              <Box
                component="select"
                value={selectedType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedType(e.target.value as Exclude<FastingType, 'custom'>)}
                sx={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
              >
                {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Box>
            </Box>
            <Typography sx={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', textAlign: 'right', maxWidth: '180px', lineHeight: '18px' }}>
              {formatEndTime(config.fastingHours)}
            </Typography>
          </Box>
          <Button variant="contained" fullWidth size="large"
            onClick={() => onStartFastingDirect(config)}
            sx={{ borderRadius: '12px', bgcolor: PRIMARY_BTN, boxShadow: 'none', fontSize: '16px', fontWeight: 700, '&:hover': { bgcolor: PRIMARY_DARK, boxShadow: 'none' } }}
          >
            바로 시작
          </Button>
        </Box>

        {/* 예약 카드 */}
        <Box onClick={() => { setReserveOpen(true); setReserveStep(1); }}
          sx={{ py: '24px', borderRadius: '16px', bgcolor: 'white', boxShadow: CARD_SHADOW, cursor: 'pointer', '&:active': { opacity: 0.85 } }}
        >
          <Box sx={{ mx: '24px' }}>
            <Typography sx={{ fontSize: '18px', fontWeight: 700, color: PRIMARY, lineHeight: '24px', mb: '6px' }}>
              단식 시간을 예약할게요
            </Typography>
            <Typography sx={{ fontSize: '13px', color: SUB_COLOR, lineHeight: '18px' }}>
              오늘 식사가 아직이라면, 식사 마칠 시간을 입력해요
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 빠른 시작 Drawer */}
      <Drawer anchor="bottom" open={quickOpen} onClose={closeQuick}
        slotProps={{ paper: { sx: { borderRadius: '24px 24px 0 0', px: '24px', pt: '8px', pb: '40px', maxHeight: '90vh', overflowY: 'auto' } } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '16px' }}>
          {quickStep > 1
            ? <IconButton size="small" onClick={() => setQuickStep(s => s - 1)}><ArrowBackIosNewIcon fontSize="small" /></IconButton>
            : <Box sx={{ width: 36 }} />}
          <IconButton size="small" onClick={closeQuick}><CloseIcon fontSize="small" /></IconButton>
        </Box>

        {quickStep === 1 && (
          <>
            <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#000', mb: '8px' }}>마지막 식사를 마친 시간이 언제인가요?</Typography>
            <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '24px' }}>정확한 시간을 알면 경과 시간을 반영할 수 있어요</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'now' as const, title: '방금 먹었어요', desc: '지금 이 순간부터 단식 카운트를 시작해요' },
                { key: 'pick' as const, title: '시간 직접 선택', desc: '이미 단식 중이라면 시작 시간을 입력해요' },
              ].map(opt => (
                <Box key={opt.key}
                  onClick={() => { setPastChoice(opt.key); setQuickStep(2); }}
                  sx={{ py: '20px', borderRadius: '16px', bgcolor: 'white', boxShadow: CARD_SHADOW, cursor: 'pointer' }}
                >
                  <Box sx={{ mx: '24px' }}>
                    <Typography sx={{ fontSize: '16px', fontWeight: 700, color: PRIMARY, mb: '4px' }}>{opt.title}</Typography>
                    <Typography sx={{ fontSize: '13px', color: SUB_COLOR }}>{opt.desc}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </>
        )}

        {quickStep === 2 && pastChoice === 'pick' && (
          <>
            <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#000', mb: '8px' }}>마지막 식사를 마친 시간이 언제인가요?</Typography>
            <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '24px' }}>경과 시간을 반영해서 단식 타이머를 시작해요</Typography>
            <ToggleButtonGroup exclusive value={pastDay} onChange={(_, v) => v && setPastDay(v)} fullWidth sx={{ mb: '16px' }}>
              <ToggleButton value="today" sx={{ flex: 1, py: 1.5 }}>오늘</ToggleButton>
              <ToggleButton value="yesterday" sx={{ flex: 1, py: 1.5 }}>어제</ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <FormControl>
                <Select value={isPastHourValid ? pastHour : ''} onChange={e => setPastHour(e.target.value)} displayEmpty
                  sx={{ width: 96, height: 56, textAlign: 'center', fontWeight: 700, fontSize: '1.25rem' }} renderValue={v => v || '--'}
                  MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                >
                  {pastAvailableHours.map(i => { const l = i.toString().padStart(2, '0'); return <MenuItem key={i} value={l}>{l}시</MenuItem>; })}
                </Select>
              </FormControl>
              <Typography variant="h5" fontWeight={700}>:</Typography>
              <FormControl>
                <Select value={isPastMinuteValid ? pastMinute : ''} onChange={e => setPastMinute(e.target.value)} displayEmpty
                  sx={{ width: 96, height: 56, textAlign: 'center', fontWeight: 700, fontSize: '1.25rem' }} renderValue={v => v || '--'}
                  MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                >
                  {pastAvailableMinutes.map(m => { const v = m.toString().padStart(2, '0'); return <MenuItem key={m} value={v}>{v}분</MenuItem>; })}
                </Select>
              </FormControl>
            </Box>
            {elapsedPreview && (
              <Box sx={{ mt: '16px' }}>
                <InfoCard>
                  <Typography sx={{ fontSize: '14px', fontWeight: 700, color: PRIMARY }}>
                    이미 {elapsedPreview.h}시간 {elapsedPreview.m}분째 단식 중이에요
                  </Typography>
                </InfoCard>
              </Box>
            )}
            <Button variant="contained" fullWidth size="large" disabled={!isPastHourValid || !isPastMinuteValid}
              onClick={() => setQuickStep(3)} sx={{ borderRadius: '12px', mt: '24px' }}>다음</Button>
          </>
        )}

        {((quickStep === 2 && pastChoice === 'now') || (quickStep === 3 && pastChoice === 'pick')) && (
          <>
            <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#000', mb: '8px' }}>단식 패턴을 선택해주세요</Typography>
            <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '24px' }}>
              {pastChoice === 'pick' && elapsedPreview
                ? `이미 ${elapsedPreview.h}시간 ${elapsedPreview.m}분 경과`
                : '지금부터 목표 시간을 선택해주세요'}
            </Typography>
            <ToggleButtonGroup exclusive value={selectedType} onChange={(_, v) => v && setSelectedType(v)} fullWidth sx={{ mb: '16px' }}>
              {(['12:12', '14:10', '16:8', '18:6'] as const).map(t => (
                <ToggleButton key={t} value={t} sx={{ flex: 1, py: 1.5 }}><Typography variant="body2" fontWeight={700}>{t}</Typography></ToggleButton>
              ))}
            </ToggleButtonGroup>
            <InfoCard>
              <Typography sx={{ fontSize: '14px', color: SUB_COLOR }}>다음 식사 가능</Typography>
              <Typography sx={{ fontSize: '16px', fontWeight: 700, color: PRIMARY, mt: '4px' }}>
                {formatWallClockWithDay(new Date((pastChoice === 'pick' && pastStartDate ? pastStartDate.getTime() : Date.now()) + config.fastingHours * 60 * 60 * 1000))}
              </Typography>
            </InfoCard>
            <Button variant="contained" fullWidth size="large"
              onClick={() => {
                if (pastChoice === 'now') onStartFastingDirect(config);
                else if (pastChoice === 'pick' && pastStartDate) onStartFastingFromPast(config, pastStartDate);
                closeQuick();
              }}
              sx={{ borderRadius: '12px', mt: '24px' }}>
              단식 시작하기
            </Button>
          </>
        )}
      </Drawer>

      {/* 예약 Drawer */}
      <Drawer anchor="bottom" open={reserveOpen} onClose={closeReserve}
        slotProps={{ paper: { sx: { borderRadius: '24px 24px 0 0', px: '24px', pt: '8px', pb: '40px', maxHeight: '90vh', overflowY: 'auto' } } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '16px' }}>
          {reserveStep > 1
            ? <IconButton size="small" onClick={() => setReserveStep(s => s - 1)}><ArrowBackIosNewIcon fontSize="small" /></IconButton>
            : <Box sx={{ width: 36 }} />}
          <IconButton size="small" onClick={closeReserve}><CloseIcon fontSize="small" /></IconButton>
        </Box>

        {reserveStep === 1 && (
          <>
            <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#000', mb: '8px' }}>오늘 마지막 식사는 몇 시에 끝날까요?</Typography>
            <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '24px' }}>식사 종료 예정 시간을 기준으로 단식을 예약해요</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <FormControl>
                <Select value={isMealEndHourValid ? mealEndHour : ''} onChange={e => setMealEndHour(e.target.value)} displayEmpty
                  sx={{ width: 96, height: 56, textAlign: 'center', fontWeight: 700, fontSize: '1.25rem' }} renderValue={v => v || '--'}
                  MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                >
                  {flowAHours.map(i => { const l = i.toString().padStart(2, '0'); return <MenuItem key={i} value={l}>{l}시</MenuItem>; })}
                </Select>
              </FormControl>
              <Typography variant="h5" fontWeight={700}>:</Typography>
              <FormControl>
                <Select value={isMealEndMinuteValid ? mealEndMinute : ''} onChange={e => setMealEndMinute(e.target.value)} displayEmpty
                  sx={{ width: 96, height: 56, textAlign: 'center', fontWeight: 700, fontSize: '1.25rem' }} renderValue={v => v || '--'}
                  MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                >
                  {flowAMinutes.map(m => { const v = m.toString().padStart(2, '0'); return <MenuItem key={m} value={v}>{v}분</MenuItem>; })}
                </Select>
              </FormControl>
            </Box>
            <Button variant="contained" fullWidth size="large" disabled={!isMealEndHourValid || !isMealEndMinuteValid}
              onClick={() => setReserveStep(2)} sx={{ borderRadius: '12px', mt: '24px' }}>다음</Button>
          </>
        )}

        {reserveStep === 2 && (
          <>
            <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#000', mb: '8px' }}>단식 패턴을 선택해주세요</Typography>
            <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '24px' }}>식사 종료: {mealEndHour}:{mealEndMinute} 기준</Typography>
            <ToggleButtonGroup exclusive value={reserveType} onChange={(_, v) => v && setReserveType(v)} fullWidth sx={{ mb: '16px' }}>
              {(['12:12', '14:10', '16:8', '18:6'] as const).map(t => (
                <ToggleButton key={t} value={t} sx={{ flex: 1, py: 1.5 }}><Typography variant="body2" fontWeight={700}>{t}</Typography></ToggleButton>
              ))}
            </ToggleButtonGroup>
            {reserveNextMeal && (
              <InfoCard>
                <Typography sx={{ fontSize: '14px', color: SUB_COLOR }}>다음 식사 가능</Typography>
                <Typography sx={{ fontSize: '16px', fontWeight: 700, color: PRIMARY, mt: '4px' }}>{formatWallClockWithDay(reserveNextMeal)}</Typography>
              </InfoCard>
            )}
            <Button variant="contained" fullWidth size="large" onClick={() => setReserveStep(3)} sx={{ borderRadius: '12px', mt: '24px' }}>다음</Button>
          </>
        )}

        {reserveStep === 3 && (
          <>
            <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#000', mb: '8px' }}>단식이 예약됐어요</Typography>
            <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '24px' }}>식사를 마치면 자동으로 단식이 시작돼요</Typography>
            <InfoCard>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: '식사 종료 예정', value: mealEndDate ? formatWallClock(mealEndDate) : '-' },
                  { label: '다음 식사', value: reserveNextMeal ? formatWallClockWithDay(reserveNextMeal) : '-', highlight: true },
                ].map(row => (
                  <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '14px', color: SUB_COLOR }}>{row.label}</Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: row.highlight ? PRIMARY : '#000' }}>{row.value}</Typography>
                  </Box>
                ))}
              </Box>
            </InfoCard>
            <Button variant="contained" fullWidth size="large"
              onClick={() => { if (mealEndDate) onReserveFasting(reserveConfig, mealEndDate); closeReserve(); }}
              sx={{ borderRadius: '12px', mt: '24px' }}>예약하기</Button>
          </>
        )}
      </Drawer>
    </Box>
  );
}

// ────────────────────────────────────────────────────────────
// 통합 HomeScreen (모드 전환)
// ────────────────────────────────────────────────────────────
export function HomeScreen({
  currentPhase, currentSession,
  totalCompletedSessions, statusMessage,
  onStartFastingDirect, onStartFastingFromPast, onReserveFasting,
  onEndFasting, onResetToSetup, onUpdateStartTime, getCurrentStage,
}: HomeScreenProps) {
  const isFasting = currentPhase === 'fasting' && !!currentSession;

  return (
    <AnimatePresence mode="wait">
      {isFasting && currentSession ? (
        <motion.div key="fasting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} style={{ minHeight: '100dvh' }}>
          <FastingMode
            session={currentSession}
            onEndFasting={onEndFasting}
            onResetToSetup={onResetToSetup}
            onUpdateStartTime={onUpdateStartTime}
            getCurrentStage={getCurrentStage}
          />
        </motion.div>
      ) : (
        <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <HomeMode
            totalCompletedSessions={totalCompletedSessions}
            statusMessage={statusMessage}
            onStartFastingDirect={onStartFastingDirect}
            onStartFastingFromPast={onStartFastingFromPast}
            onReserveFasting={onReserveFasting}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
