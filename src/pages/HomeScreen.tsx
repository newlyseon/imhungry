import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
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
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import { Flame, Lightbulb } from 'lucide-react';
import { CircleProgress } from '@/components/CircleProgress';
import { useCountdown, useElapsed } from '@/hooks/useCountdown';
import {
  FastingConfig, FastingType, FastingSession, AppPhase,
  FASTING_PRESETS, FASTING_STAGES, FastingStage, SessionRecord,
  RecurringSchedule, DayOfWeek, toISODate,
} from '@/hooks/useFastingStore';
import { formatWallClock, formatWallClockWithDay, formatTimerDisplay } from '@/lib/formatTime';

import fastingBg1 from '@/assets/fasting-bg-1.png';
import fastingBg2 from '@/assets/fasting-bg-2.png';

const FASTING_BGS = [fastingBg1, fastingBg2];

// ── 디자인 토큰 (홈 모드) ────────────────────────────────────
const PRIMARY = '#006ACD';
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
  return `${isToday ? '오늘' : '내일'} ${ampm} ${displayH}시${displayM} 종료`;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function getLast7Days(history: SessionRecord[]) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toDateString();
    const dayRecords = history.filter(r => new Date(r.timestamp).toDateString() === dateStr);
    return {
      label: DAY_LABELS[d.getDay()],
      isToday: i === 6,
      hasSuccess: dayRecords.some(r => r.isSuccess),
      hasRecord: dayRecords.length > 0,
    };
  });
}

function getCurrentStreak(history: SessionRecord[]): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i <= 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const hasSuccess = history.some(r => new Date(r.timestamp).toDateString() === d.toDateString() && r.isSuccess);
    if (hasSuccess) {
      streak++;
    } else if (i > 0) {
      break;
    }
    // i === 0 & no record today → skip (user hasn't fasted yet today)
  }
  return streak;
}

function getSmartTip(streak: number, totalSessions: number): string {
  const h = new Date().getHours();
  if (streak >= 7) return `${streak}일 연속 성공! 몸이 이미 리듬을 기억하고 있어요.`;
  if (streak >= 3) return `${streak}일 연속 성공 중이에요. 이 흐름 그대로 이어가요.`;
  if (totalSessions === 0) return '첫 단식이에요. 12:12부터 가볍게 시작해봐요.';
  if (h >= 6 && h < 10) return '아침 공복 상태를 활용해보세요. 지금이 시작하기 가장 좋아요!';
  if (h >= 20 || h < 3) return '자는 동안 절반이 지나가요. 지금 시작하면 수월해요.';
  if (h >= 14 && h < 18) return '오후 슬럼프 전에 단식을 시작하면 에너지가 안정돼요.';
  return '규칙적인 단식은 3주가 지나면 자연스럽게 습관이 돼요.';
}

interface FastingInfoItem { title: string; body: string; }
const FASTING_INFO: FastingInfoItem[] = [
  { title: '혈당이 안정되는 시간이에요', body: '식후 2~4시간은 혈당이 내려가며 인슐린 분비가 줄어들어요. 몸이 소화 대신 회복 모드로 전환되기 시작해요.' },
  { title: '지방 연소가 시작됐어요', body: '글리코겐이 고갈되면 몸은 지방을 에너지원으로 쓰기 시작해요. 이 시점부터 체지방 분해가 본격적으로 일어나요.' },
  { title: '지방 연소가 활발해요', body: '케톤체 생성이 활성화되며 뇌와 근육이 지방에서 에너지를 얻어요. 집중력이 오히려 높아지는 걸 느낄 수 있어요.' },
  { title: '오토파지가 시작됐어요', body: '16시간 이상 단식하면 세포가 손상된 단백질을 스스로 제거하는 오토파지가 활성화돼요. 노화 방지와 면역 향상에 도움이 돼요.' },
];

function getFastingInfoByElapsed(elapsedMs: number): FastingInfoItem {
  const hours = elapsedMs / (1000 * 60 * 60);
  if (hours >= 16) return FASTING_INFO[3];
  if (hours >= 8) return FASTING_INFO[2];
  if (hours >= 4) return FASTING_INFO[1];
  return FASTING_INFO[0];
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
  defaultFastingType: Exclude<FastingType, 'custom'>;
  onStartFastingDirect: (config: FastingConfig) => void;
  onStartFastingFromPast: (config: FastingConfig, startTime: Date) => void;
  onReserveFasting: (config: FastingConfig, scheduledStart: Date) => void;
  onEndFasting: () => void;
  onResetToSetup: () => void;
  onUpdateStartTime: (newStartTime: Date) => void;
  onUpdateReservedStart: (newStart: Date) => void;
  onUpdateReservedConfig: (config: FastingConfig) => void;
  getCurrentStage: () => FastingStage | null;
  recurringSchedule: RecurringSchedule | null;
  skippedDates: string[];
  onSetRecurringSchedule: (schedule: RecurringSchedule) => void;
  onCancelRecurringSchedule: () => void;
  onSkipToday: () => void;
}

// ────────────────────────────────────────────────────────────
// 단식 모드
// ────────────────────────────────────────────────────────────
function FastingMode({
  session, onEndFasting, onCancelFasting, onUpdateStartTime, getCurrentStage,
}: {
  session: FastingSession;
  onEndFasting: () => void;
  onCancelFasting: () => void;
  onUpdateStartTime: (d: Date) => void;
  getCurrentStage: () => FastingStage | null;
}) {
  const [showElapsed, setShowElapsed] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [showEditTime, setShowEditTime] = useState(false);
  const stepperRef = useRef<HTMLDivElement>(null);

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

  const STAGE_ITEM_H = 42; // 원 10px + gap 32px
  const CLIP_H = 105; // 2.5단계 높이

  useEffect(() => {
    stepperRef.current?.scrollTo({ top: currentStageIndex * STAGE_ITEM_H, behavior: 'smooth' });
  }, [currentStageIndex]);

  return (
    <>
      {/* 콘텐츠 — 시작/종료 바 포함, 탭바 높이만큼 pb */}
      <Box
        sx={{
          px: '24px', pt: 'max(44px, env(safe-area-inset-top))',
          pb: `${TAB_BAR_HEIGHT + 16}px`,
        }}
      >
        {/* 타이틀 */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ mb: '20px' }}>
            <Typography sx={{ fontSize: '24px', fontWeight: 700, lineHeight: '32px', color: F_TEXT }}>
              {isComplete ? '목표 달성!' : `단식한지 ${progressPercent}% 경과!`}
            </Typography>
            <Typography sx={{ fontSize: '24px', fontWeight: 700, lineHeight: '32px', color: F_TEXT }}>
              {isComplete ? '이제 건강한 음식 마음껏 드세요.' : (currentStage?.description ?? '단식을 시작했어요')}
            </Typography>
          </Box>
        </motion.div>

        {/* 원형 타이머 */}
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: '20px' }}>
            <CircleProgress progress={progress} colorClass="fasting" size={260}>
              <Typography sx={{ color: F_TEXT, mb: '4px', fontSize: '16px', fontWeight: 600 }}>
                {isComplete ? '목표 달성!' : showElapsed ? '지나간 시간' : '남은시간'}
              </Typography>
              <Box
                component="button"
                onClick={() => setShowElapsed(p => !p)}
                sx={{ fontSize: '2.25rem', fontWeight: 700, color: F_ACCENT, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', bgcolor: 'transparent', border: 'none', cursor: 'pointer', transition: 'opacity 0.15s', '&:active': { opacity: 0.6 } }}
              >
                {isComplete ? '00 : 00 : 00' : showElapsed ? formatTimerDisplay(elapsedMs) : formatted}
              </Box>
              {!isComplete && (
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', mt: '6px', fontSize: '14px', textAlign: 'center' }}>
                  {showElapsed
                    ? `${formatWallClock(new Date(session.fastingStartTime))}에 시작했어요`
                    : `${formatWallClock(new Date(targetTime))}에 식사할 수 있어요`}
                </Typography>
              )}
            </CircleProgress>
          </Box>
        </motion.div>

        {/* 수직 스테이지 스테퍼 */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Box
              ref={stepperRef}
              sx={{
                height: `${CLIP_H}px`,
                overflowY: 'scroll',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
                mb: '18px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)',
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 25%, black 75%, transparent 100%)',
              }}>
            <Box sx={{ pt: '16px', pb: '40px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {FASTING_STAGES.map((stage, i) => {
              const elapsedHours = elapsedMs / (1000 * 60 * 60);
              const isReached = elapsedHours >= stage.startHour;
              const isCurrent = currentStage?.name === stage.name;
              const isLast = i === FASTING_STAGES.length - 1;
              return (
                <Box key={stage.name} sx={{ display: 'flex', alignItems: 'stretch', width: '100%', maxWidth: '320px' }}>
                  {/* 좌측: 타이틀 */}
                  <Box sx={{ flex: 1, textAlign: 'right', pr: '12px', pb: isLast ? 0 : '32px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-end' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '10px' }}>
                      <Typography sx={{ fontSize: '13px', fontWeight: isCurrent ? 700 : 500, color: isReached ? F_TEXT : F_MUTED, lineHeight: 1 }}>
                        {stage.name}
                      </Typography>
                    </Box>
                  </Box>
                  {/* 중앙: 원 + 연결선 */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '10px' }}>
                    <Box sx={{
                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                      bgcolor: isReached ? F_ACCENT : F_BORDER,
                      boxShadow: isCurrent ? `0 0 0 3px rgba(48,158,255,0.2)` : 'none',
                    }} />
                    {!isLast && (
                      <Box sx={{ width: '2px', flexGrow: 1, bgcolor: isReached ? F_ACCENT : F_BORDER }} />
                    )}
                  </Box>
                  {/* 우측: 서브텍스트 */}
                  <Box sx={{ flex: 1, pl: '12px', pb: isLast ? 0 : '32px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', height: '10px' }}>
                      {isCurrent ? (
                        <Typography sx={{ fontSize: '12px', color: F_ACCENT, lineHeight: 1.4 }}>
                          {stage.description}
                        </Typography>
                      ) : (
                        <Typography sx={{ fontSize: '12px', color: F_MUTED, lineHeight: 1.2 }}>
                          {stage.startHour > 0 ? `${stage.startHour}h+` : '시작'}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })}
            </Box>
          </Box>
        </motion.div>

        {/* 시작/종료 info 바 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: '16px' }}>
          <Box onClick={openEditTime} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', py: '16px' }}>
            <Typography sx={{ fontSize: '13px', color: F_MUTED, mb: '4px', fontWeight: 400 }}>시작</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 500, color: F_TEXT }}>
                {formatWallClock(new Date(session.fastingStartTime))}
              </Typography>
              <EditRoundedIcon sx={{ fontSize: '13px', color: F_MUTED }} />
            </Box>
          </Box>
          <Box sx={{ width: '1px', height: '36px', bgcolor: F_BORDER }} />
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', py: '16px' }}>
            <Typography sx={{ fontSize: '13px', color: F_MUTED, mb: '4px', fontWeight: 400 }}>종료</Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: 500, color: isComplete ? F_ACCENT : F_TEXT }}>
              {formatWallClock(new Date(targetTime))}
            </Typography>
          </Box>
        </Box>

        {/* 취소 / 즉시 종료 버튼 — 최하단 */}
        <Box sx={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="outlined"
            onClick={onCancelFasting}
            sx={{
              borderRadius: '12px',
              borderColor: F_BORDER,
              color: F_MUTED,
              fontSize: '15px',
              fontWeight: 700,
              px: '20px',
              flexShrink: 0,
              '&&': { height: '50px' },
              '&:hover': { borderColor: F_BORDER, bgcolor: 'rgba(255,255,255,0.08)' },
            }}
          >
            취소
          </Button>
          <Button
            fullWidth
            variant="contained"
            onClick={() => isComplete ? onEndFasting() : setShowNudge(true)}
            sx={{
              borderRadius: '12px',
              bgcolor: isComplete ? F_ACCENT : 'rgba(48,158,255,0.18)',
              boxShadow: 'none',
              color: F_TEXT,
              fontSize: '15px',
              fontWeight: 700,
              '&&': { height: '50px' },
              '&:hover': { bgcolor: isComplete ? '#1a8de0' : 'rgba(48,158,255,0.28)', boxShadow: 'none' },
            }}
          >
            {isComplete ? '목표 달성! 단식 종료하기' : '단식 즉시 종료'}
          </Button>
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
          sx={{ borderRadius: '12px', '&&': { height: '50px' } }}
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
          조금만 더 하면 {FASTING_STAGES[Math.min(currentStageIndex + 1, FASTING_STAGES.length - 1)].name} 단계예요!
        </Typography>
        <Box sx={{ display: 'flex', gap: '12px' }}>
          <Button variant="contained" size="large" onClick={() => setShowNudge(false)}
            sx={{ flex: 1, borderRadius: '12px', '&&': { height: '50px' } }}
          >계속 할게요</Button>
          <Button variant="outlined" size="large" onClick={() => { onEndFasting(); setShowNudge(false); }}
            sx={{ flex: 1, borderRadius: '12px', '&&': { height: '50px' } }}
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
  currentPhase, currentSession,
  totalCompletedSessions, statusMessage, defaultFastingType, recentHistory,
  onStartFastingDirect, onStartFastingFromPast, onReserveFasting, onCancelReservation,
  onUpdateReservedStart, onUpdateReservedConfig, onGoToFasting,
  recurringSchedule, skippedDates, onSetRecurringSchedule, onCancelRecurringSchedule, onSkipToday,
}: {
  currentPhase: AppPhase;
  currentSession: FastingSession | null;
  totalCompletedSessions: number;
  statusMessage?: string;
  defaultFastingType: Exclude<FastingType, 'custom'>;
  recentHistory: SessionRecord[];
  onStartFastingDirect: (config: FastingConfig) => void;
  onStartFastingFromPast: (config: FastingConfig, startTime: Date) => void;
  onReserveFasting: (config: FastingConfig, scheduledStart: Date) => void;
  onCancelReservation: () => void;
  onUpdateReservedStart: (newStart: Date) => void;
  onUpdateReservedConfig: (config: FastingConfig) => void;
  onGoToFasting?: () => void;
  recurringSchedule: RecurringSchedule | null;
  skippedDates: string[];
  onSetRecurringSchedule: (schedule: RecurringSchedule) => void;
  onCancelRecurringSchedule: () => void;
  onSkipToday: () => void;
}) {
  const [selectedType, setSelectedType] = useState<Exclude<FastingType, 'custom'>>(defaultFastingType);
  const [typeMenuAnchor, setTypeMenuAnchor] = useState<null | HTMLElement>(null);
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

  // 예약 시간 편집 drawer state
  const [showReserveEditTime, setShowReserveEditTime] = useState(false);
  const reservedDate = currentSession?.reservedFastingStart ? new Date(currentSession.reservedFastingStart) : new Date();
  const [editReserveDay, setEditReserveDay] = useState<'today' | 'tomorrow'>(() =>
    reservedDate.toDateString() === new Date().toDateString() ? 'today' : 'tomorrow'
  );
  const [editReserveHour, setEditReserveHour] = useState(reservedDate.getHours().toString().padStart(2, '0'));
  const [editReserveMinute, setEditReserveMinute] = useState(
    Math.round(reservedDate.getMinutes() / 5) * 5 === 60
      ? '00' : (Math.round(reservedDate.getMinutes() / 5) * 5).toString().padStart(2, '0')
  );

  const openReserveEditTime = () => {
    const d = currentSession?.reservedFastingStart ? new Date(currentSession.reservedFastingStart) : new Date();
    setEditReserveDay(d.toDateString() === new Date().toDateString() ? 'today' : 'tomorrow');
    setEditReserveHour(d.getHours().toString().padStart(2, '0'));
    const rounded = Math.round(d.getMinutes() / 5) * 5;
    setEditReserveMinute(rounded === 60 ? '00' : rounded.toString().padStart(2, '0'));
    setShowReserveEditTime(true);
  };

  const now2 = new Date();
  const reserveEditHours = editReserveDay === 'tomorrow'
    ? Array.from({ length: 24 }, (_, i) => i)
    : Array.from({ length: 24 }, (_, i) => i).filter(i => i > now2.getHours() || (i === now2.getHours() && now2.getMinutes() < 55));
  const reserveEditMinutes = (editReserveDay === 'today' && parseInt(editReserveHour) === now2.getHours())
    ? Array.from({ length: 12 }, (_, i) => i * 5).filter(m => m > now2.getMinutes())
    : Array.from({ length: 12 }, (_, i) => i * 5);
  const isReserveEditHourValid = reserveEditHours.includes(parseInt(editReserveHour));
  const isReserveEditMinuteValid = reserveEditMinutes.includes(parseInt(editReserveMinute));

  const handleSaveReserveTime = () => {
    if (!isReserveEditHourValid || !isReserveEditMinuteValid) return;
    const d = new Date();
    if (editReserveDay === 'tomorrow') d.setDate(d.getDate() + 1);
    d.setHours(parseInt(editReserveHour), parseInt(editReserveMinute), 0, 0);
    onUpdateReservedStart(d);
    setShowReserveEditTime(false);
  };

  const streak = getCurrentStreak(recentHistory);
  const last7Days = getLast7Days(recentHistory);
  const smartTip = getSmartTip(streak, totalCompletedSessions);

  const isReserved = currentPhase === 'reserved' && !!currentSession?.reservedFastingStart;
  const isFastingActive = currentPhase === 'fasting' && !!currentSession;

  // ── 반복 단식 설정 ────────────────────────────────────────
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [todayFastingMenuAnchor, setTodayFastingMenuAnchor] = useState<null | HTMLElement>(null);
  const [recurringStep, setRecurringStep] = useState(1);
  const [rcPattern, setRcPattern] = useState<Exclude<FastingType, 'custom'>>('16:8');
  const [rcDays, setRcDays] = useState<DayOfWeek[]>([1, 2, 3, 4, 5]);
  const [rcMealHour, setRcMealHour] = useState('20');
  const [rcMealMinute, setRcMealMinute] = useState('00');
  const [rcNotifStart, setRcNotifStart] = useState(true);
  const [rcNotifEating, setRcNotifEating] = useState(true);
  const [rcNotifMid, setRcNotifMid] = useState(false);

  const DAY_LABELS: { dow: DayOfWeek; label: string }[] = [
    { dow: 1, label: '월' }, { dow: 2, label: '화' }, { dow: 3, label: '수' },
    { dow: 4, label: '목' }, { dow: 5, label: '금' }, { dow: 6, label: '토' }, { dow: 0, label: '일' },
  ];

  const PATTERN_INFO: { type: Exclude<FastingType, 'custom'>; desc: string; group: string }[] = [
    { type: '12:12', desc: '수면으로 절반 채워져요', group: '가볍게 시작' },
    { type: '14:10', desc: '여성·초보자에게 추천', group: '가볍게 시작' },
    { type: '16:8',  desc: '가장 많이 하는 방식',   group: '표준' },
    { type: '18:6',  desc: '16:8에 익숙해졌다면',   group: '도전' },
    { type: '20:4',  desc: '상급자용',               group: '도전' },
  ];

  const closeRecurring = () => { setRecurringOpen(false); setRecurringStep(1); };

  const handleSaveRecurring = () => {
    onSetRecurringSchedule({
      pattern: rcPattern,
      days: rcDays,
      lastMealHour: parseInt(rcMealHour),
      lastMealMinute: parseInt(rcMealMinute),
      notifications: { start: rcNotifStart, eating: rcNotifEating, midpoint: rcNotifMid },
    });
    closeRecurring();
  };

  // 오늘의 단식 상태 계산
  const todayISO = toISODate(new Date());
  const todayDOW = new Date().getDay() as DayOfWeek;
  const isTodayFastingDay = recurringSchedule ? recurringSchedule.days.includes(todayDOW) : false;
  const isTodaySkipped = skippedDates.includes(todayISO);
  const hasRecurring = !!recurringSchedule;

  // 주간 달성 카드 (반복 설정 시)
  const weeklyDays = useMemo(() => {
    if (!recurringSchedule) return [];
    const today = new Date();
    const dow = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
    monday.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = toISODate(d);
      const dDow = d.getDay() as DayOfWeek;
      const isScheduled = recurringSchedule.days.includes(dDow);
      const isCompleted = recentHistory.some(r => toISODate(new Date(r.timestamp)) === iso && r.isSuccess);
      const isSkipped = skippedDates.includes(iso);
      const isToday = iso === todayISO;
      const isFuture = d.getTime() > today.setHours(23, 59, 59, 999);
      return { label: DAY_LABELS.find(l => l.dow === dDow)?.label ?? '', isScheduled, isCompleted, isSkipped, isToday, isFuture };
    });
  }, [recurringSchedule, recentHistory, skippedDates, todayISO]);

  const weeklyScheduledCount = weeklyDays.filter(d => d.isScheduled).length;
  const weeklyCompletedCount = weeklyDays.filter(d => d.isCompleted).length;

  // 다음 단식 요일 (쉬는 날 카드용)
  const nextFastingDayLabel = useMemo(() => {
    if (!recurringSchedule) return '';
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      if (recurringSchedule.days.includes(d.getDay() as DayOfWeek)) {
        return DAY_LABELS.find(l => l.dow === (d.getDay() as DayOfWeek))?.label ?? '';
      }
    }
    return '';
  }, [recurringSchedule]);

  // hook은 조건부 호출 불가 — 예약/단식 없을 땐 fallback 값으로 대체
  const reservedTarget = currentSession?.reservedFastingStart ?? (Date.now() + 86400000);
  const { formatted: reserveCountdown } = useCountdown(reservedTarget);
  const fastingStartFallback = currentSession?.fastingStartTime ?? Date.now();
  const { elapsedMs: fastingElapsedMs } = useElapsed(fastingStartFallback);

  return (
    <>
      <Box sx={{ minHeight: '100dvh', px: '24px', pt: 'max(44px, env(safe-area-inset-top))', pb: `${TAB_BAR_HEIGHT + 16}px` }}>
      {/* 헤더 */}
      <Box sx={{ mb: '32px' }}>
        <Typography sx={{ fontSize: '24px', fontWeight: 700, lineHeight: '32px', color: F_TEXT }}>
          {getGreeting()}
        </Typography>
        <Typography sx={{ fontSize: '24px', fontWeight: 700, lineHeight: '32px', color: F_TEXT }}>
          오늘부터{' '}
          <Box component="span" sx={{ color: F_ACCENT }}>{totalCompletedSessions + 1}일!</Box>
          {' '}함께 시작해요.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* 단식 진행중 카드 — 1순위 최상단 */}
        {isFastingActive && currentSession && (
          <Box
            onClick={onGoToFasting}
            sx={{ bgcolor: '#006ACD', borderRadius: '16px', p: '20px', cursor: 'pointer', userSelect: 'none' }}
          >
            {/* 헤더 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', mb: '16px' }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.8)' }} />
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>단식 진행중</Typography>
            </Box>
            {/* 유형 + 진행률 */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: '8px' }}>
              <Typography sx={{ fontSize: '22px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                {currentSession.config.type}
              </Typography>
              <Typography sx={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                {Math.round(Math.min(fastingElapsedMs / (currentSession.config.fastingHours * 3600000), 1) * 100)}%
              </Typography>
            </Box>
            {/* 진행률 바 */}
            <LinearProgress
              variant="determinate"
              value={Math.min(fastingElapsedMs / (currentSession.config.fastingHours * 3600000), 1) * 100}
              sx={{ borderRadius: '4px', height: '8px', mb: '14px', bgcolor: 'rgba(255,255,255,0.25)', '& .MuiLinearProgress-bar': { bgcolor: '#fff' } }}
            />
            {/* 시작/종료 시각 */}
            <Typography sx={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
              {formatWallClock(new Date(currentSession.fastingStartTime))} 시작 · {formatWallClock(new Date(currentSession.fastingStartTime + currentSession.config.fastingHours * 3600000))} 종료
            </Typography>
          </Box>
        )}

        {/* 반복 단식 — 오늘의 단식 카드 (최상단) */}
        {hasRecurring && !isReserved && !isFastingActive && isTodayFastingDay && !isTodaySkipped && recurringSchedule && (
          <Box sx={{ bgcolor: F_BG, border: `1px solid ${F_ACCENT}55`, borderRadius: '16px', p: '20px', backdropFilter: 'blur(6px)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '14px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: F_ACCENT }} />
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: F_ACCENT }}>오늘의 단식</Typography>
              </Box>
              <IconButton
                size="small"
                onClick={(e) => setTodayFastingMenuAnchor(e.currentTarget)}
                sx={{ color: F_MUTED, p: 0, mx: 0, minWidth: 0, width: 'auto', height: 'auto' }}
              >
                <MoreVertRoundedIcon sx={{ fontSize: '24px' }} />
              </IconButton>
              <Menu
                anchorEl={todayFastingMenuAnchor}
                open={Boolean(todayFastingMenuAnchor)}
                onClose={() => setTodayFastingMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{ paper: { sx: { borderRadius: '12px', boxShadow: '0px 4px 20px rgba(0,0,0,0.12)', minWidth: '120px' } } }}
              >
                <MenuItem
                  onClick={() => { setTodayFastingMenuAnchor(null); setRecurringOpen(true); setRecurringStep(1); }}
                  sx={{ fontSize: '15px', fontWeight: 600, py: '10px' }}
                >
                  편집
                </MenuItem>
                <MenuItem
                  onClick={() => { setTodayFastingMenuAnchor(null); onCancelRecurringSchedule(); }}
                  sx={{ fontSize: '15px', fontWeight: 600, py: '10px', color: '#E53935' }}
                >
                  삭제
                </MenuItem>
              </Menu>
            </Box>
            <Typography sx={{ fontSize: '22px', fontWeight: 700, color: F_TEXT, mb: '4px' }}>
              {recurringSchedule.pattern}
            </Typography>
            <Typography sx={{ fontSize: '14px', color: F_MUTED, mb: '16px' }}>
              오후 {recurringSchedule.lastMealHour}:{String(recurringSchedule.lastMealMinute).padStart(2, '0')} 이후 식사를 마치면 단식이 시작돼요
            </Typography>
            <Box sx={{ display: 'flex', gap: '8px' }}>
              <Button variant="contained" size="large"
                onClick={() => onStartFastingDirect(FASTING_PRESETS[recurringSchedule.pattern])}
                sx={{ flex: 1, borderRadius: '12px', bgcolor: F_ACCENT, boxShadow: 'none', fontSize: '15px', fontWeight: 700, color: '#fff', '&&': { padding: '14px 24px', height: '50px' }, '&:hover': { bgcolor: '#1a8de0', boxShadow: 'none' } }}
              >
                지금 바로 시작
              </Button>
              <Button variant="outlined" size="large"
                onClick={onSkipToday}
                sx={{ flexShrink: 0, borderRadius: '12px', borderColor: F_BORDER, color: F_MUTED, fontSize: '15px', fontWeight: 600, '&&': { px: '12px', height: '50px' } }}
              >
                오늘 건너뛰기
              </Button>
            </Box>
          </Box>
        )}

        {/* 예약 현황 카드 */}
        {isReserved && currentSession && (
          <Box sx={{ bgcolor: F_BG, border: `1px solid ${F_ACCENT}55`, backdropFilter: 'blur(6px)', borderRadius: '16px', p: '20px' }}>
            {/* 헤더: 라벨 + 취소 */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '16px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: F_ACCENT }} />
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: F_ACCENT }}>단식 예약됨</Typography>
              </Box>
              <Box component="button" onClick={onCancelReservation}
                sx={{ border: 'none', bgcolor: 'transparent', cursor: 'pointer', p: '4px', display: 'flex', alignItems: 'center' }}
              >
                <CloseIcon sx={{ fontSize: '18px', color: F_MUTED }} />
              </Box>
            </Box>

            {/* 단식 유형 편집 */}
            <Typography sx={{ fontSize: '12px', color: F_MUTED, mb: '6px' }}>단식 유형</Typography>
            <Box
              onClick={e => (e.currentTarget as HTMLElement).querySelector('select')?.click()}
              sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', mb: '16px' }}
            >
              <Typography sx={{ fontSize: '22px', fontWeight: 700, color: F_TEXT, lineHeight: 1 }}>
                {currentSession.config.type}
              </Typography>
              <KeyboardArrowDownRoundedIcon sx={{ fontSize: '18px', color: F_MUTED }} />
              <Box
                component="select"
                value={currentSession.config.type}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  const t = e.target.value as Exclude<FastingType, 'custom'>;
                  onUpdateReservedConfig(FASTING_PRESETS[t]);
                }}
                sx={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
              >
                {ALL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Box>
            </Box>

            {/* 식사 종료 시간 편집 */}
            <Typography sx={{ fontSize: '12px', color: F_MUTED, mb: '6px' }}>식사 종료 시간</Typography>
            <Box
              onClick={openReserveEditTime}
              sx={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', mb: '16px' }}
            >
              <Typography sx={{ fontSize: '18px', fontWeight: 600, color: F_TEXT }}>
                {formatWallClock(new Date(currentSession.reservedFastingStart!))}
              </Typography>
              <EditRoundedIcon sx={{ fontSize: '16px', color: F_MUTED }} />
            </Box>

            {/* 카운트다운 */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '6px', borderTop: `1px solid ${F_BORDER}`, pt: '14px' }}>
              <Typography sx={{ fontSize: '13px', color: F_MUTED }}>시작까지</Typography>
              <Typography sx={{ fontSize: '20px', fontWeight: 700, color: F_ACCENT, fontVariantNumeric: 'tabular-nums' }}>
                {reserveCountdown}
              </Typography>
            </Box>
          </Box>
        )}

        {/* 예약 시간 편집 Drawer */}
        <Drawer anchor="bottom" open={showReserveEditTime} onClose={() => setShowReserveEditTime(false)}
          slotProps={{ paper: { sx: { borderRadius: '24px 24px 0 0', px: '24px', pb: '40px', pt: '24px', bgcolor: 'white' } } }}
        >
          <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#000', mb: '4px' }}>식사 종료 시간 수정</Typography>
          <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '24px' }}>단식이 시작될 시간을 입력해주세요.</Typography>
          <ToggleButtonGroup exclusive value={editReserveDay} onChange={(_, v) => v && setEditReserveDay(v)} fullWidth sx={{ mb: '16px' }}>
            {(['today', 'tomorrow'] as const).map(val => (
              <ToggleButton key={val} value={val} sx={{ flex: 1, py: '12px' }}>
                {val === 'today' ? '오늘' : '내일'}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', mb: '16px' }}>
            <FormControl>
              <Select value={isReserveEditHourValid ? editReserveHour : ''} onChange={e => setEditReserveHour(e.target.value)} displayEmpty
                sx={{ width: 96, height: 56, textAlign: 'center', fontWeight: 700, fontSize: '1.25rem' }}
                renderValue={v => v || '--'}
                MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
              >
                {reserveEditHours.map(i => { const l = i.toString().padStart(2, '0'); return <MenuItem key={i} value={l}>{l}시</MenuItem>; })}
              </Select>
            </FormControl>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#000' }}>:</Typography>
            <FormControl>
              <Select value={isReserveEditMinuteValid ? editReserveMinute : ''} onChange={e => setEditReserveMinute(e.target.value)} displayEmpty
                sx={{ width: 96, height: 56, textAlign: 'center', fontWeight: 700, fontSize: '1.25rem' }}
                renderValue={v => v || '--'}
                MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
              >
                {reserveEditMinutes.map(m => { const v = m.toString().padStart(2, '0'); return <MenuItem key={m} value={v}>{v}분</MenuItem>; })}
              </Select>
            </FormControl>
          </Box>
          <Button variant="contained" fullWidth size="large" onClick={handleSaveReserveTime}
            disabled={!isReserveEditHourValid || !isReserveEditMinuteValid}
            sx={{ borderRadius: '12px', '&&': { height: '50px' } }}
          >
            저장
          </Button>
        </Drawer>

        {/* 2. 스마트 팁 — 단식 중이거나 반복 예약 있으면 숨김 */}
        {!isFastingActive && !hasRecurring && (
          <Box sx={{ bgcolor: F_BG, border: `1px solid ${F_BORDER}`, backdropFilter: 'blur(6px)', borderRadius: '16px', p: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lightbulb size={16} color={F_ACCENT} style={{ flexShrink: 0 }} />
            <Typography sx={{ fontSize: '14px', color: F_TEXT, lineHeight: '21px' }}>{smartTip}</Typography>
          </Box>
        )}

        {/* 1순위. 단식 인포 카드 — 단식 중일 때만 */}
        {isFastingActive && (() => {
          const info = getFastingInfoByElapsed(fastingElapsedMs);
          return (
            <Box sx={{ bgcolor: F_BG, border: `1px solid ${F_BORDER}`, backdropFilter: 'blur(6px)', borderRadius: '16px', p: '20px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', mb: '10px' }}>
                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: F_MUTED }}>지금 내 몸은</Typography>
              </Box>
              <Typography sx={{ fontSize: '16px', fontWeight: 700, color: F_TEXT, mb: '6px', lineHeight: '22px' }}>
                {info.title}
              </Typography>
              <Typography sx={{ fontSize: '13px', color: F_MUTED, lineHeight: '20px' }}>
                {info.body}
              </Typography>
            </Box>
          );
        })()}

        {/* 2순위. 광고 카드 — 단식 중일 때만 */}
        {isFastingActive && (
          <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', border: `1px solid ${F_BORDER}`, backdropFilter: 'blur(6px)', borderRadius: '16px', p: '20px' }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: F_MUTED, mb: '10px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>단식 후 추천</Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 700, color: F_TEXT, mb: '6px', lineHeight: '22px' }}>
              단식 종료 후 첫 식사, 뭘 먹을까요?
            </Typography>
            <Typography sx={{ fontSize: '13px', color: F_MUTED, lineHeight: '20px', mb: '14px' }}>
              공복 직후엔 소화 부담이 적은 유산균 음료나 견과류로 시작하면 위장 부담 없이 영양을 보충할 수 있어요.
            </Typography>
            <Box sx={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['유산균 음료', '견과류 믹스', '단백질 쉐이크'].map(item => (
                <Box key={item} sx={{ px: '8px', py: '4px', borderRadius: '16px', border: `1px solid ${F_BORDER}`, bgcolor: 'rgba(48,158,255,0.1)' }}>
                  <Typography sx={{ fontSize: '12px', fontWeight: 600, color: F_ACCENT }}>{item}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* 3. 바로 시작 카드 — 예약/단식 중이면 숨김 */}
        {!isReserved && !isFastingActive && (
        <Box sx={{ bgcolor: F_BG, border: `1px solid ${F_BORDER}`, backdropFilter: 'blur(6px)', borderRadius: '16px', p: '20px' }}>
          {/* 단식 유형 */}
          <Typography sx={{ fontSize: '12px', color: F_MUTED, mb: '6px' }}>단식 유형</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '16px' }}>
            <Box
              onClick={e => setTypeMenuAnchor(e.currentTarget)}
              sx={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            >
              <Typography sx={{ fontSize: '22px', fontWeight: 700, color: F_TEXT, lineHeight: 1 }}>
                {selectedType}
              </Typography>
              <KeyboardArrowDownRoundedIcon sx={{ fontSize: '18px', color: F_MUTED }} />
            </Box>
            <Menu
              anchorEl={typeMenuAnchor}
              open={Boolean(typeMenuAnchor)}
              onClose={() => setTypeMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              slotProps={{ paper: { sx: { borderRadius: '12px', boxShadow: '0px 4px 20px rgba(0,0,0,0.12)', minWidth: '120px' } } }}
            >
              {ALL_TYPES.map(t => (
                <MenuItem
                  key={t}
                  selected={t === selectedType}
                  onClick={() => { setSelectedType(t as Exclude<FastingType, 'custom'>); setTypeMenuAnchor(null); }}
                  sx={{ fontSize: '14px', fontWeight: 600, py: '10px' }}
                >
                  {t}
                </MenuItem>
              ))}
            </Menu>
            <Typography sx={{ fontSize: '14px', color: F_MUTED, textAlign: 'right', maxWidth: '180px', lineHeight: '18px' }}>
              {formatEndTime(config.fastingHours)}
            </Typography>
          </Box>
          <Button variant="contained" fullWidth size="large"
            onClick={() => onStartFastingDirect(config)}
            sx={{ borderRadius: '12px', bgcolor: F_ACCENT, boxShadow: 'none', fontSize: '15px', fontWeight: 700, color: '#fff', '&&': { padding: '14px 24px', height: '50px' }, '&:hover': { bgcolor: '#1a8de0', boxShadow: 'none' } }}
          >
            바로 시작
          </Button>
        </Box>
        )}

        {/* 예약 카드 — 예약/단식 중이면 숨김 */}
        {!isReserved && !isFastingActive && (
          <Box sx={{ borderRadius: '16px', bgcolor: F_BG, border: `1px solid ${F_BORDER}`, backdropFilter: 'blur(6px)' }}>
            <Box sx={{ mx: '20px', mt: '20px', mb: '16px' }}>
              <Typography sx={{ fontSize: '18px', fontWeight: 700, color: F_TEXT, lineHeight: '24px', mb: '6px' }}>
                단식 시간을 예약할게요
              </Typography>
              <Typography sx={{ fontSize: '14px', color: F_MUTED, lineHeight: '18px', mb: '16px' }}>
                오늘 식사가 더 남았다면, 식사 마칠 시간을 입력해요
              </Typography>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                startIcon={<AccessTimeRoundedIcon />}
                onClick={() => { setReserveOpen(true); setReserveStep(1); }}
                sx={{
                  borderRadius: '12px',
                  borderColor: F_BORDER,
                  color: F_TEXT,
                  fontSize: '15px',
                  fontWeight: 700,
                  '&&': { padding: '14px 24px', height: '50px' },
                  '&:hover': { borderColor: F_ACCENT, color: F_ACCENT, bgcolor: 'rgba(48,158,255,0.08)' },
                }}
              >
                예약하기
              </Button>
              <Button
                variant="text"
                fullWidth
                onClick={() => { setRecurringOpen(true); setRecurringStep(1); }}
                sx={{ borderRadius: '12px', color: F_MUTED, fontSize: '14px', fontWeight: 400, mt: '4px', py: '8px' }}
              >
                반복 설정하기
              </Button>
            </Box>
          </Box>
        )}

        {/* 반복 단식 — 쉬는 날 카드 */}
        {hasRecurring && !isReserved && !isFastingActive && (!isTodayFastingDay || isTodaySkipped) && (
          <Box sx={{ bgcolor: F_BG, border: `1px solid ${F_BORDER}`, borderRadius: '16px', p: '20px', backdropFilter: 'blur(6px)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography sx={{ fontSize: '16px', fontWeight: 700, color: F_TEXT, mb: '6px' }}>오늘은 쉬는 날</Typography>
                <Typography sx={{ fontSize: '13px', color: F_MUTED, mb: '4px' }}>
                  이번 주 달성: {weeklyCompletedCount} / {weeklyScheduledCount}일
                </Typography>
                {nextFastingDayLabel && (
                  <Typography sx={{ fontSize: '13px', color: F_MUTED }}>다음 단식: {nextFastingDayLabel}요일</Typography>
                )}
              </Box>
              <Typography sx={{ fontSize: '28px' }}>☕</Typography>
            </Box>
            {recurringSchedule && (
              <Button variant="outlined" fullWidth size="large" onClick={() => onStartFastingDirect(FASTING_PRESETS[recurringSchedule!.pattern])}
                sx={{ mt: '16px', borderRadius: '12px', borderColor: F_BORDER, color: F_TEXT, fontSize: '14px', fontWeight: 600, '&&': { height: '50px' } }}
              >
                그래도 오늘 할게요
              </Button>
            )}
          </Box>
        )}

        {/* 반복 단식 — 주간 진행 카드 */}
        {hasRecurring && weeklyDays.length > 0 && (
          <Box sx={{ bgcolor: F_BG, border: `1px solid ${F_BORDER}`, borderRadius: '16px', p: '20px', backdropFilter: 'blur(6px)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '14px' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: F_TEXT }}>이번 주</Typography>
              <Typography sx={{ fontSize: '12px', color: F_MUTED }}>
                {weeklyCompletedCount} / {weeklyScheduledCount}일 달성
                {isFastingActive ? ' · 오늘 진행 중' : ''}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              {weeklyDays.map((d, i) => (
                <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <Typography sx={{ fontSize: '11px', color: d.isToday ? F_ACCENT : F_MUTED, fontWeight: d.isToday ? 700 : 500 }}>
                    {d.label}
                  </Typography>
                  <Box sx={{
                    width: 28, height: 28, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: d.isCompleted ? `${F_ACCENT}22` : d.isToday && isFastingActive ? `${F_ACCENT}11` : 'transparent',
                    border: `1.5px solid ${d.isCompleted ? F_ACCENT : d.isToday ? F_MUTED : 'rgba(255,255,255,0.12)'}`,
                  }}>
                    {d.isCompleted
                      ? <Flame size={13} color={F_ACCENT} />
                      : d.isSkipped
                        ? <Typography sx={{ fontSize: '11px', color: F_MUTED }}>✗</Typography>
                        : d.isToday && isFastingActive
                          ? <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: F_ACCENT }} />
                          : !d.isScheduled
                            ? <Typography sx={{ fontSize: '11px', color: F_MUTED }}>—</Typography>
                            : null}
                  </Box>
                </Box>
              ))}
            </Box>
            <Button variant="text" size="small"
              onClick={onCancelRecurringSchedule}
              sx={{ mt: '12px', color: F_MUTED, fontSize: '12px', p: 0, minWidth: 0 }}
            >
              반복 중단
            </Button>
          </Box>
        )}

        {/* 주간 성취 달력 — 반복 설정 없을 때만 */}
        {!hasRecurring && (
        <Box sx={{ bgcolor: F_BG, border: `1px solid ${F_BORDER}`, backdropFilter: 'blur(6px)', borderRadius: '16px', p: '20px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', mb: '16px' }}>
            <Flame size={16} color={F_ACCENT} />
            <Typography sx={{ fontSize: '16px', fontWeight: 700, color: F_TEXT }}>
              {streak > 0 ? `${streak}일 연속 성공!` : '연속 달성기록'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            {last7Days.map((day, i) => (
              <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <Typography sx={{ fontSize: '12px', fontWeight: 500, color: day.isToday ? F_ACCENT : F_MUTED }}>
                  {day.isToday ? '오늘' : day.label}
                </Typography>
                <Box sx={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: day.hasSuccess ? `${F_ACCENT}22` : day.hasRecord ? 'rgba(255,255,255,0.05)' : 'transparent',
                  border: `1.5px solid ${day.hasSuccess ? F_ACCENT : day.isToday ? F_MUTED : 'rgba(255,255,255,0.12)'}`,
                }}>
                  {day.hasSuccess
                    ? <Flame size={13} color={F_ACCENT} />
                    : day.hasRecord
                      ? <Typography sx={{ fontSize: '12px', color: F_MUTED }}>✗</Typography>
                      : day.isToday
                        ? <Typography sx={{ fontSize: '10px', color: F_MUTED }}>·</Typography>
                        : null}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
        )}

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
              onClick={() => setQuickStep(3)} sx={{ borderRadius: '12px', mt: '24px', '&&': { height: '50px' } }}>다음</Button>
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
              sx={{ borderRadius: '12px', mt: '24px', '&&': { height: '50px' } }}>
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
              onClick={() => setReserveStep(2)} sx={{ borderRadius: '12px', mt: '24px', '&&': { height: '50px' } }}>다음</Button>
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
            <Button variant="contained" fullWidth size="large" onClick={() => setReserveStep(3)} sx={{ borderRadius: '12px', mt: '24px', '&&': { height: '50px' } }}>다음</Button>
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
              sx={{ borderRadius: '12px', mt: '24px', '&&': { height: '50px' } }}>예약하기</Button>
          </>
        )}
      </Drawer>

      {/* 반복 설정 Drawer */}
      <Drawer anchor="bottom" open={recurringOpen} onClose={closeRecurring}
        slotProps={{ paper: { sx: { borderRadius: '24px 24px 0 0', px: '24px', pt: '8px', pb: '40px', maxHeight: '92vh', overflowY: 'auto' } } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '16px' }}>
          {recurringStep > 1
            ? <IconButton size="small" onClick={() => setRecurringStep(s => s - 1)}><ArrowBackIosNewIcon fontSize="small" /></IconButton>
            : <Box sx={{ width: 36 }} />}
          <Typography sx={{ fontSize: '14px', fontWeight: 600, color: SUB_COLOR }}>{recurringStep} / 5</Typography>
          <IconButton size="small" onClick={closeRecurring}><CloseIcon fontSize="small" /></IconButton>
        </Box>

        {/* Step 1: 패턴 선택 */}
        {recurringStep === 1 && (
          <>
            <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#000', mb: '4px' }}>어떤 패턴으로 단식할까요?</Typography>
            <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '20px' }}>나에게 맞는 단식 루틴을 골라요</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', mb: '24px' }}>
              {PATTERN_INFO.map(p => (
                <Box key={p.type} onClick={() => setRcPattern(p.type)}
                  sx={{
                    p: '16px', borderRadius: '12px', cursor: 'pointer',
                    border: `2px solid ${rcPattern === p.type ? PRIMARY : 'rgba(0,0,0,0.1)'}`,
                    bgcolor: rcPattern === p.type ? 'rgba(0,106,205,0.06)' : 'white',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#000' }}>{p.type}</Typography>
                    <Typography sx={{ fontSize: '13px', color: SUB_COLOR }}>{p.desc}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '12px', fontWeight: 600, color: PRIMARY, bgcolor: 'rgba(0,106,205,0.1)', px: '8px', py: '4px', borderRadius: '8px' }}>
                    {p.group}
                  </Typography>
                </Box>
              ))}
            </Box>
            <Button variant="contained" fullWidth size="large" onClick={() => setRecurringStep(2)} sx={{ borderRadius: '12px', '&&': { height: '50px' } }}>다음</Button>
          </>
        )}

        {/* Step 2: 요일 선택 */}
        {recurringStep === 2 && (
          <>
            <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#000', mb: '4px' }}>어떤 요일에 단식할까요?</Typography>
            <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '20px' }}>쉬는 날에도 직접 시작할 수 있어요</Typography>
            <Box sx={{ display: 'flex', gap: '6px', mb: '16px' }}>
              {DAY_LABELS.map(({ dow, label }) => (
                <Box key={dow} onClick={() => setRcDays(prev => prev.includes(dow) ? prev.filter(d => d !== dow) : [...prev, dow])}
                  sx={{
                    flex: 1, py: '12px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer',
                    border: `2px solid ${rcDays.includes(dow) ? PRIMARY : 'rgba(0,0,0,0.1)'}`,
                    bgcolor: rcDays.includes(dow) ? 'rgba(0,106,205,0.06)' : 'white',
                  }}
                >
                  <Typography sx={{ fontSize: '13px', fontWeight: 700, color: rcDays.includes(dow) ? PRIMARY : SUB_COLOR }}>{label}</Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: '6px', mb: '24px' }}>
              {[
                { label: '매일', days: [0,1,2,3,4,5,6] as DayOfWeek[] },
                { label: '평일', days: [1,2,3,4,5] as DayOfWeek[] },
                { label: '주말', days: [0,6] as DayOfWeek[] },
              ].map(({ label, days }) => (
                <Button key={label} variant="outlined" size="small" onClick={() => setRcDays(days)}
                  sx={{ borderRadius: '8px', borderColor: 'rgba(0,0,0,0.15)', color: SUB_COLOR, fontSize: '12px', flex: 1 }}
                >
                  {label}
                </Button>
              ))}
            </Box>
            <Button variant="contained" fullWidth size="large" disabled={rcDays.length === 0} onClick={() => setRecurringStep(3)} sx={{ borderRadius: '12px', '&&': { height: '50px' } }}>다음</Button>
          </>
        )}

        {/* Step 3: 마지막 식사 시간 */}
        {recurringStep === 3 && (
          <>
            <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#000', mb: '4px' }}>보통 마지막 식사를 언제 마치나요?</Typography>
            <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '24px' }}>이 시간이 지나면 단식이 시작돼요</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', mb: '24px' }}>
              <FormControl>
                <Select value={rcMealHour} onChange={e => setRcMealHour(e.target.value)}
                  sx={{ width: 96, height: 56, textAlign: 'center', fontWeight: 700, fontSize: '1.25rem' }}
                  MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                >
                  {Array.from({ length: 24 }, (_, i) => i).map(i => { const l = i.toString().padStart(2, '0'); return <MenuItem key={i} value={l}>{l}시</MenuItem>; })}
                </Select>
              </FormControl>
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#000' }}>:</Typography>
              <FormControl>
                <Select value={rcMealMinute} onChange={e => setRcMealMinute(e.target.value)}
                  sx={{ width: 96, height: 56, textAlign: 'center', fontWeight: 700, fontSize: '1.25rem' }}
                >
                  {[0, 15, 30, 45].map(m => { const v = m.toString().padStart(2, '0'); return <MenuItem key={m} value={v}>{v}분</MenuItem>; })}
                </Select>
              </FormControl>
            </Box>
            <Button variant="contained" fullWidth size="large" onClick={() => setRecurringStep(4)} sx={{ borderRadius: '12px', '&&': { height: '50px' } }}>다음</Button>
          </>
        )}

        {/* Step 4: 알림 설정 */}
        {recurringStep === 4 && (
          <>
            <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#000', mb: '4px' }}>알림을 받을게요?</Typography>
            <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '20px' }}>나중에 설정에서 변경할 수 있어요</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', mb: '24px' }}>
              {[
                { label: '단식 시작 알림', desc: `${rcMealHour}시 ${rcMealMinute}분`, value: rcNotifStart, set: setRcNotifStart },
                { label: '식사 가능 알림', desc: `${parseInt(rcMealHour) + FASTING_PRESETS[rcPattern].fastingHours}시간 후`, value: rcNotifEating, set: setRcNotifEating },
                { label: '단식 중간 응원', desc: '단식 절반 지났을 때', value: rcNotifMid, set: setRcNotifMid },
              ].map(item => (
                <Box key={item.label} onClick={() => item.set(!item.value)}
                  sx={{ p: '16px', borderRadius: '12px', border: `1.5px solid ${item.value ? PRIMARY : 'rgba(0,0,0,0.1)'}`, bgcolor: item.value ? 'rgba(0,106,205,0.06)' : 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <Box>
                    <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#000' }}>{item.label}</Typography>
                    <Typography sx={{ fontSize: '13px', color: SUB_COLOR }}>{item.desc}</Typography>
                  </Box>
                  <Box sx={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${item.value ? PRIMARY : 'rgba(0,0,0,0.15)'}`, bgcolor: item.value ? PRIMARY : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.value && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'white' }} />}
                  </Box>
                </Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: '8px' }}>
              <Button variant="outlined" size="large" fullWidth onClick={() => setRecurringStep(5)} sx={{ borderRadius: '12px', borderColor: 'rgba(0,0,0,0.15)', color: SUB_COLOR, '&&': { height: '50px' } }}>나중에 설정</Button>
              <Button variant="contained" size="large" fullWidth onClick={() => setRecurringStep(5)} sx={{ borderRadius: '12px', '&&': { height: '50px' } }}>다음</Button>
            </Box>
          </>
        )}

        {/* Step 5: 스케줄 확인 */}
        {recurringStep === 5 && (
          <>
            <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#000', mb: '4px' }}>이렇게 설정할게요!</Typography>
            <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '20px' }}>언제든지 홈에서 반복 중단하거나 다시 설정할 수 있어요</Typography>
            <Box sx={{ p: '20px', borderRadius: '16px', bgcolor: 'rgba(0,106,205,0.06)', border: `1.5px solid ${PRIMARY}33`, mb: '24px' }}>
              <Typography sx={{ fontSize: '13px', fontWeight: 700, color: SUB_COLOR, mb: '12px' }}>반복 단식 스케줄</Typography>
              {[
                { label: '패턴', value: rcPattern },
                { label: '요일', value: DAY_LABELS.filter(d => rcDays.includes(d.dow)).map(d => d.label).join(' ') },
                { label: '단식 시작', value: `매일 ${rcMealHour}:${rcMealMinute}` },
                { label: '식사 가능', value: `${parseInt(rcMealHour) + FASTING_PRESETS[rcPattern].fastingHours}시간 후` },
              ].map(row => (
                <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: '10px' }}>
                  <Typography sx={{ fontSize: '14px', color: SUB_COLOR }}>{row.label}</Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#000' }}>{row.value}</Typography>
                </Box>
              ))}
              <Box sx={{ borderTop: '1px solid rgba(0,0,0,0.08)', pt: '12px', mt: '4px' }}>
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: SUB_COLOR, mb: '6px' }}>이번 주</Typography>
                <Box sx={{ display: 'flex', gap: '6px' }}>
                  {DAY_LABELS.map(({ dow, label }) => (
                    <Box key={dow} sx={{ flex: 1, py: '6px', borderRadius: '8px', textAlign: 'center', bgcolor: rcDays.includes(dow) ? PRIMARY : 'rgba(0,0,0,0.06)' }}>
                      <Typography sx={{ fontSize: '12px', fontWeight: 700, color: rcDays.includes(dow) ? 'white' : SUB_COLOR }}>{label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: '8px' }}>
              <Button variant="outlined" size="large" fullWidth onClick={() => setRecurringStep(1)} sx={{ borderRadius: '12px', borderColor: 'rgba(0,0,0,0.15)', color: SUB_COLOR, '&&': { height: '50px' } }}>다시 설정</Button>
              <Button variant="contained" size="large" fullWidth onClick={handleSaveRecurring} sx={{ borderRadius: '12px', '&&': { height: '50px' } }}>시작하기</Button>
            </Box>
          </>
        )}
      </Drawer>

    </Box>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// 통합 HomeScreen — 좌우 스와이프 구조
// ────────────────────────────────────────────────────────────
export function HomeScreen({
  currentPhase, currentSession,
  totalCompletedSessions, statusMessage, defaultFastingType, recentHistory,
  onStartFastingDirect, onStartFastingFromPast, onReserveFasting,
  onEndFasting, onResetToSetup, onUpdateStartTime,
  onUpdateReservedStart, onUpdateReservedConfig, getCurrentStage,
  recurringSchedule, skippedDates, onSetRecurringSchedule, onCancelRecurringSchedule, onSkipToday,
}: HomeScreenProps) {
  const isFasting = currentPhase === 'fasting' && !!currentSession;
  const bgImage = FASTING_BGS[Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % FASTING_BGS.length];

  // scroll-snap 컨테이너 ref + 현재 페이지 tracking
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pageIndex, setPageIndex] = useState(0);

  // 단식 시작 → 단식 페이지(1)로, 종료 → 홈(0)으로 자동 이동
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = isFasting ? 1 : 0;
    el.scrollTo({ left: target * window.innerWidth, behavior: 'smooth' });
    setPageIndex(target);
  }, [isFasting]);

  const goToFasting = () => {
    scrollRef.current?.scrollTo({ left: window.innerWidth, behavior: 'smooth' });
    setPageIndex(1);
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / window.innerWidth);
    setPageIndex(idx);
  };

  const INDICATOR_BOTTOM = TAB_BAR_HEIGHT + 10;

  return (
    <>
      {/* 배경 */}
      <Box sx={{ position: 'fixed', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }} />
      <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(17,29,41,0.85)', zIndex: 0 }} />

      {/* scroll-snap 컨테이너 */}
      <Box
        ref={scrollRef}
        onScroll={handleScroll}
        sx={{
          position: 'fixed', inset: 0, zIndex: 1,
          display: 'flex',
          overflowX: isFasting ? 'scroll' : 'hidden',
          overflowY: 'hidden',
          scrollSnapType: isFasting ? 'x mandatory' : 'none',
          WebkitOverflowScrolling: 'touch',
          // 스크롤바 숨기기
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
        }}
      >
        {/* 페이지 0: 홈 */}
        <Box sx={{
          width: '100%', flexShrink: 0,
          scrollSnapAlign: 'start',
          overflowY: 'auto', height: '100%',
        }}>
          <HomeMode
            currentPhase={currentPhase}
            currentSession={currentSession}
            totalCompletedSessions={totalCompletedSessions}
            statusMessage={statusMessage}
            defaultFastingType={defaultFastingType}
            recentHistory={recentHistory}
            onStartFastingDirect={onStartFastingDirect}
            onStartFastingFromPast={onStartFastingFromPast}
            onReserveFasting={onReserveFasting}
            onCancelReservation={onResetToSetup}
            onUpdateReservedStart={onUpdateReservedStart}
            onUpdateReservedConfig={onUpdateReservedConfig}
            onGoToFasting={goToFasting}
            recurringSchedule={recurringSchedule}
            skippedDates={skippedDates}
            onSetRecurringSchedule={onSetRecurringSchedule}
            onCancelRecurringSchedule={onCancelRecurringSchedule}
            onSkipToday={onSkipToday}
          />
        </Box>

        {/* 페이지 1: 단식 */}
        {isFasting && currentSession && (
          <Box sx={{
            width: '100%', flexShrink: 0,
            scrollSnapAlign: 'start',
            overflowY: 'auto', height: '100%',
          }}>
            <FastingMode
              session={currentSession}
              onEndFasting={onEndFasting}
              onCancelFasting={onResetToSetup}
              onUpdateStartTime={onUpdateStartTime}
              getCurrentStage={getCurrentStage}
            />
          </Box>
        )}
      </Box>

      {/* 페이지 indicator */}
      <AnimatePresence>
        {isFasting && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            style={{
              position: 'fixed',
              bottom: INDICATOR_BOTTOM,
              left: 0, right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: 6,
              zIndex: 20,
              pointerEvents: 'none',
            }}
          >
            {[0, 1].map(i => (
              <Box key={i} sx={{
                width: pageIndex === i ? 16 : 6,
                height: 6,
                borderRadius: '3px',
                bgcolor: pageIndex === i ? F_ACCENT : 'rgba(255,255,255,0.3)',
                transition: 'width 0.25s ease, background-color 0.25s ease',
              }} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
