import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Drawer from '@mui/material/Drawer';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CloseIcon from '@mui/icons-material/Close';
import { FastingConfig, FastingType, FASTING_PRESETS, SessionRecord } from '@/hooks/useFastingStore';
import { formatWallClock, formatWallClockWithDay } from '@/lib/formatTime';

interface HomeScreenProps {
  totalCompletedSessions: number;
  statusMessage?: string;
  recentHistory: SessionRecord[];
  onStartFastingDirect: (config: FastingConfig) => void;
  onStartFastingFromPast: (config: FastingConfig, startTime: Date) => void;
  onStartEating?: (config: FastingConfig) => void;
  onReserveFasting: (config: FastingConfig, scheduledStart: Date) => void;
}

type FlowKey = 'A' | 'B' | null;

const PRESETS: { type: Exclude<FastingType, 'custom'>; label: string; subtitle: string }[] = [
  { type: '12:12', label: '12:12', subtitle: '입문' },
  { type: '14:10', label: '14:10', subtitle: '표준' },
  { type: '16:8', label: '16:8', subtitle: '일반' },
];

const HOME_OPTIONS = [
  { key: 'A' as FlowKey, emoji: '⚡', title: '바로 단식을 시작할 수 있어요', desc: '방금 먹었거나, 이미 단식 중이에요' },
  { key: 'B' as FlowKey, emoji: '🍽️', title: '오늘 식사가 예정되어 있어요', desc: '식사 종료 시간을 예약하면 자동으로 단식이 시작돼요' },
];

function RoutineSelector({
  value,
  onChange,
}: {
  value: Exclude<FastingType, 'custom'>;
  onChange: (v: Exclude<FastingType, 'custom'>) => void;
}) {
  return (
    <ToggleButtonGroup exclusive value={value} onChange={(_, v) => v && onChange(v)} fullWidth>
      {PRESETS.map(t => (
        <ToggleButton key={t.type} value={t.type} sx={{ flex: 1, py: 1.5, flexDirection: 'column', gap: 0.25 }}>
          <Typography variant="body2" fontWeight={700}>{t.label}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.75 }}>{t.subtitle}</Typography>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

function TimePicker({
  hour, minute, onHourChange, onMinuteChange,
  availableHours, availableMinutes, isHourValid, isMinuteValid,
}: {
  hour: string; minute: string;
  onHourChange: (v: string) => void; onMinuteChange: (v: string) => void;
  availableHours: number[]; availableMinutes: number[];
  isHourValid: boolean; isMinuteValid: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
      <FormControl>
        <Select
          value={isHourValid ? hour : ''}
          onChange={(e) => onHourChange(e.target.value)}
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
          onChange={(e) => onMinuteChange(e.target.value)}
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
  );
}

export function HomeScreen({
  totalCompletedSessions,
  statusMessage,
  onStartFastingDirect,
  onStartFastingFromPast,
  onReserveFasting,
}: HomeScreenProps) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Drawer state
  const [activeFlow, setActiveFlow] = useState<FlowKey>(null);
  const [flowStep, setFlowStep] = useState(1);

  // Flow A: 마지막 식사 시간 (오늘 고정, 전체 시간 허용)
  const [mealEndHour, setMealEndHour] = useState('');
  const [mealEndMinute, setMealEndMinute] = useState('00');

  // Flow B: 서브 선택 + 과거 시간 피커
  const [bSubChoice, setBSubChoice] = useState<'now' | 'pick' | null>(null);
  const [pastDay, setPastDay] = useState<'today' | 'yesterday'>('today');
  const [pastHour, setPastHour] = useState('');
  const [pastMinute, setPastMinute] = useState('00');

  // 공통 패턴
  const [selectedType, setSelectedType] = useState<Exclude<FastingType, 'custom'>>('16:8');
  const config = FASTING_PRESETS[selectedType];

  // Flow A 시간 검증 (현재 시간 이후만 허용 - 미래 예약)
  const allMinutes = Array.from({ length: 12 }, (_, i) => i * 5);
  const flowAHours = Array.from({ length: 24 }, (_, i) => i).filter(i => i >= currentHour);
  const flowAMinutes = parseInt(mealEndHour) === currentHour
    ? allMinutes.filter(m => m > currentMinute)
    : allMinutes;
  const isMealEndHourValid = flowAHours.includes(parseInt(mealEndHour));
  const isMealEndMinuteValid = flowAMinutes.includes(parseInt(mealEndMinute));

  const mealEndDate = useMemo(() => {
    if (!isMealEndHourValid || !isMealEndMinuteValid) return null;
    const d = new Date();
    d.setHours(parseInt(mealEndHour), parseInt(mealEndMinute), 0, 0);
    return d;
  }, [mealEndHour, mealEndMinute, isMealEndHourValid, isMealEndMinuteValid]);

  const nextMealDateA = useMemo(() => {
    if (!mealEndDate) return null;
    return new Date(mealEndDate.getTime() + config.fastingHours * 60 * 60 * 1000);
  }, [mealEndDate, config]);

  // Flow B 과거 시간 검증
  const allHours = Array.from({ length: 24 }, (_, i) => i);
  const pastAvailableHours = pastDay === 'yesterday'
    ? allHours
    : Array.from({ length: currentHour + 1 }, (_, i) => i);

  const pastAvailableMinutes = (pastDay === 'today' && parseInt(pastHour) === currentHour)
    ? allMinutes.filter(m => m <= currentMinute)
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

  const elapsedPreviewB = useMemo(() => {
    if (!pastStartDate) return null;
    const ms = Date.now() - pastStartDate.getTime();
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const remainMs = config.fastingHours * 60 * 60 * 1000 - ms;
    const remainH = Math.max(0, Math.floor(remainMs / (1000 * 60 * 60)));
    const remainM = Math.max(0, Math.floor((remainMs % (1000 * 60 * 60)) / (1000 * 60)));
    const nextMeal = new Date(pastStartDate.getTime() + config.fastingHours * 60 * 60 * 1000);
    return { h, m, remainH, remainM, nextMeal };
  }, [pastStartDate, config]);

  const closeDrawer = () => {
    setActiveFlow(null);
    setFlowStep(1);
    setBSubChoice(null);
  };

  const handleBack = () => {
    if (flowStep === 1) { closeDrawer(); return; }
    // Flow A step 3(pick)으로 돌아오면 bSubChoice 리셋
    if (activeFlow === 'A' && bSubChoice === 'pick' && flowStep === 3) {
      setBSubChoice(null);
    }
    setFlowStep(s => s - 1);
  };

  const handleConfirm = () => {
    if (activeFlow === 'A') {
      if (bSubChoice === 'now') {
        onStartFastingDirect(config);
      } else if (bSubChoice === 'pick' && pastStartDate) {
        onStartFastingFromPast(config, pastStartDate);
      }
    } else if (activeFlow === 'B' && mealEndDate) {
      onReserveFasting(config, mealEndDate);
    }
    closeDrawer();
  };

  // Drawer 콘텐츠 렌더링
  const renderDrawerContent = () => {
    // ── Flow B: 오늘 식사가 예정되어 있어요 (미래 시간 예약) ──
    if (activeFlow === 'B') {
      if (flowStep === 1) {
        // Step 1: 시간 피커
        return (
          <>
            <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
              식사 예정이시군요! 오늘 마지막 식사는 몇 시쯤 끝날까요?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              식사 종료 예정 시간을 기준으로 단식을 예약해요
            </Typography>
            <TimePicker
              hour={mealEndHour} minute={mealEndMinute}
              onHourChange={setMealEndHour} onMinuteChange={setMealEndMinute}
              availableHours={flowAHours} availableMinutes={flowAMinutes}
              isHourValid={isMealEndHourValid} isMinuteValid={isMealEndMinuteValid}
            />
            <Button
              variant="contained" fullWidth size="large"
              disabled={!isMealEndHourValid || !isMealEndMinuteValid}
              onClick={() => setFlowStep(2)}
              sx={{ borderRadius: 3, mt: 3 }}
            >
              다음
            </Button>
          </>
        );
      }
      if (flowStep === 2) {
        // Step 2: 패턴 선택
        return (
          <>
            <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
              단식 패턴을 선택해주세요
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              식사 종료: {mealEndHour}:{mealEndMinute} 기준
            </Typography>
            <RoutineSelector value={selectedType} onChange={setSelectedType} />
            {nextMealDateA && (
              <Paper elevation={0} sx={{ bgcolor: 'grey.100', borderRadius: 3, p: 2, mt: 2.5, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">다음 식사 가능</Typography>
                <Typography variant="body1" fontWeight={700} sx={{ color: 'primary.dark', mt: 0.25 }}>
                  {formatWallClockWithDay(nextMealDateA)}
                </Typography>
              </Paper>
            )}
            <Button
              variant="contained" fullWidth size="large"
              onClick={() => setFlowStep(3)}
              sx={{ borderRadius: 3, mt: 2.5 }}
            >
              다음
            </Button>
          </>
        );
      }
      if (flowStep === 3) {
        // Step 3: 확인
        return (
          <>
            <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
              ✅ 단식이 예약됐어요!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              식사를 마치면 자동으로 단식이 시작돼요
            </Typography>
            <Paper elevation={0} sx={{ bgcolor: 'grey.100', borderRadius: 3, p: 2.5, mb: 2.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">식사 종료 예정</Typography>
                  <Typography variant="body2" fontWeight={700} color="text.primary">
                    {formatWallClock(mealEndDate!)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">단식 시작</Typography>
                  <Typography variant="body2" fontWeight={700} color="text.primary">
                    {formatWallClock(mealEndDate!)} 이후 자동 시작
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">다음 식사</Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: 'primary.dark' }}>
                    {nextMealDateA ? formatWallClockWithDay(nextMealDateA) : '-'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
            <Button
              variant="contained" fullWidth size="large"
              onClick={handleConfirm}
              sx={{ borderRadius: 3 }}
            >
              예약하기
            </Button>
          </>
        );
      }
    }

    // ── Flow A: 바로 단식을 시작할 수 있어요 (서브선택/과거시간) ──
    if (activeFlow === 'A') {
      if (flowStep === 1) {
        // Step 1: 서브 선택
        return (
          <>
            <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
              마지막 식사를 마친 시간이 언제인가요?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              정확한 시간을 알면 경과 시간을 반영할 수 있어요
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {[
                { key: 'now' as const, emoji: '⚡', title: '방금 먹었어요', desc: '지금 이 순간부터 단식 카운트를 시작해요' },
                { key: 'pick' as const, emoji: '🕐', title: '시간 직접 선택', desc: '이미 단식 중이라면 시작 시간을 입력해요' },
              ].map(opt => (
                <Paper
                  key={opt.key}
                  component="button"
                  elevation={1}
                  onClick={() => { setBSubChoice(opt.key); setFlowStep(2); }}
                  sx={{
                    width: '100%', p: 2, textAlign: 'left', bgcolor: 'background.paper',
                    border: 'none', cursor: 'pointer', borderRadius: 3,
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    '&:hover': { boxShadow: 3 },
                  }}
                >
                  <Typography sx={{ fontSize: '1.5rem', lineHeight: 1, flexShrink: 0 }}>{opt.emoji}</Typography>
                  <Box>
                    <Typography variant="body1" fontWeight={700} color="text.primary">{opt.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{opt.desc}</Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          </>
        );
      }

      if (flowStep === 2 && bSubChoice === 'pick') {
        // Step 2 (pick): 과거 시간 피커
        return (
          <>
            <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
              마지막 식사를 마친 시간이 언제인가요?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              경과 시간을 반영해서 단식 타이머를 시작해요
            </Typography>
            <ToggleButtonGroup
              exclusive value={pastDay}
              onChange={(_, v) => v && setPastDay(v)}
              fullWidth sx={{ mb: 2 }}
            >
              <ToggleButton value="today" sx={{ flex: 1, py: 1.5 }}>오늘</ToggleButton>
              <ToggleButton value="yesterday" sx={{ flex: 1, py: 1.5 }}>어제</ToggleButton>
            </ToggleButtonGroup>
            <TimePicker
              hour={pastHour} minute={pastMinute}
              onHourChange={setPastHour} onMinuteChange={setPastMinute}
              availableHours={pastAvailableHours} availableMinutes={pastAvailableMinutes}
              isHourValid={isPastHourValid} isMinuteValid={isPastMinuteValid}
            />
            {elapsedPreviewB && (
              <Paper elevation={0} sx={{ bgcolor: 'grey.100', borderRadius: 3, p: 2, mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" fontWeight={700} sx={{ color: 'primary.dark' }}>
                  이미 {elapsedPreviewB.h}시간 {elapsedPreviewB.m}분째 단식 중이에요! 💪
                </Typography>
              </Paper>
            )}
            <Button
              variant="contained" fullWidth size="large"
              disabled={!isPastHourValid || !isPastMinuteValid}
              onClick={() => setFlowStep(3)}
              sx={{ borderRadius: 3, mt: 2.5 }}
            >
              다음
            </Button>
          </>
        );
      }

      if ((flowStep === 2 && bSubChoice === 'now') || (flowStep === 3 && bSubChoice === 'pick')) {
        // 패턴 선택
        return (
          <>
            <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
              단식 패턴을 선택해주세요
            </Typography>
            {bSubChoice === 'pick' && elapsedPreviewB ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                이미 {elapsedPreviewB.h}시간 {elapsedPreviewB.m}분 경과 · 목표까지 {elapsedPreviewB.remainH}시간 {elapsedPreviewB.remainM}분 남음
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                지금부터 목표 시간을 선택해주세요
              </Typography>
            )}
            <RoutineSelector value={selectedType} onChange={setSelectedType} />
            {bSubChoice === 'pick' && elapsedPreviewB && (
              <Paper elevation={0} sx={{ bgcolor: 'grey.100', borderRadius: 3, p: 2, mt: 2.5, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">다음 식사 가능</Typography>
                <Typography variant="body1" fontWeight={700} sx={{ color: 'primary.dark', mt: 0.25 }}>
                  {formatWallClockWithDay(elapsedPreviewB.nextMeal)}
                </Typography>
              </Paper>
            )}
            {bSubChoice === 'now' && (
              <Paper elevation={0} sx={{ bgcolor: 'grey.100', borderRadius: 3, p: 2, mt: 2.5, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">다음 식사 가능</Typography>
                <Typography variant="body1" fontWeight={700} sx={{ color: 'primary.dark', mt: 0.25 }}>
                  {formatWallClockWithDay(new Date(Date.now() + config.fastingHours * 60 * 60 * 1000))}
                </Typography>
              </Paper>
            )}
            <Button
              variant="contained" fullWidth size="large"
              onClick={handleConfirm}
              sx={{ borderRadius: 3, mt: 2.5 }}
            >
              단식 시작하기
            </Button>
          </>
        );
      }
    }

    return null;
  };

  const hour = now.getHours();
  const greeting = hour < 12 ? '좋은 아침이에요 ☀️' : hour < 18 ? '오늘도 화이팅 👋' : '좋은 저녁이에요 🌇';

  return (
    <Box sx={{ height: '100vh', bgcolor: 'background.default', px: 2.5, display: 'flex', flexDirection: 'column', pt: '40px', overflowY: 'auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="h5" fontWeight={700} color="text.primary">{greeting}</Typography>
          {totalCompletedSessions > 0 && (
            <Chip
              icon={<EmojiEventsIcon sx={{ fontSize: 16 }} />}
              label={`${totalCompletedSessions}회`}
              size="small"
              sx={{ fontWeight: 700, bgcolor: 'action.hover', color: 'text.primary', px: 0.5 }}
            />
          )}
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: statusMessage ? 1.5 : 3 }}>
          지금 어떤 상황인가요?
        </Typography>
        {statusMessage && (
          <Paper elevation={0} sx={{ bgcolor: 'primary.main', borderRadius: 3, px: 2, py: 1.5, mb: 2.5 }}>
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>{statusMessage}</Typography>
          </Paper>
        )}
      </motion.div>

      {/* 3 option cards */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pb: 4 }}>
        {HOME_OPTIONS.map((opt, i) => (
          <motion.div
            key={String(opt.key)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.06 }}
            whileTap={{ scale: 0.97 }}
          >
            <Paper
              component="button"
              elevation={1}
              onClick={() => { setActiveFlow(opt.key); setFlowStep(1); }}
              sx={{
                width: '100%', p: 2.5, textAlign: 'left',
                bgcolor: 'background.paper', border: 'none', cursor: 'pointer', borderRadius: 3,
                display: 'flex', alignItems: 'center', gap: 2,
                transition: 'box-shadow 0.15s', '&:hover': { boxShadow: 3 },
              }}
            >
              <Typography sx={{ fontSize: '1.75rem', lineHeight: 1, flexShrink: 0 }}>{opt.emoji}</Typography>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body1" fontWeight={700} color="text.primary">{opt.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{opt.desc}</Typography>
              </Box>
            </Paper>
          </motion.div>
        ))}
      </Box>

      {/* 단일 Drawer */}
      <Drawer
        anchor="bottom"
        open={activeFlow !== null}
        onClose={closeDrawer}
        PaperProps={{ sx: { borderRadius: '24px 24px 0 0', px: 2.5, pt: 1.5, pb: 4, maxHeight: '90vh', overflowY: 'auto' } }}
      >
        {/* 네비게이션 헤더 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          {flowStep > 1
            ? <IconButton size="small" onClick={handleBack}><ArrowBackIosNewIcon fontSize="small" /></IconButton>
            : <Box sx={{ width: 36 }} />
          }
          <IconButton size="small" onClick={closeDrawer}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        {renderDrawerContent()}
      </Drawer>
    </Box>
  );
}
