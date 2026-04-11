import { useState, useMemo } from 'react';
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
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CloseIcon from '@mui/icons-material/Close';
import { FastingConfig, FastingType, FastingSession, AppPhase, FASTING_PRESETS, SessionRecord } from '@/hooks/useFastingStore';
import { useCountdown } from '@/hooks/useCountdown';
import { formatWallClock, formatWallClockWithDay } from '@/lib/formatTime';

// ── 디자인 토큰 ──────────────────────────────────────────────
const PRIMARY = '#00498D';
const PRIMARY_DARK = '#003A70';
const PRIMARY_BTN = '#1A5FAD';
const CARD_SHADOW = '0px 7px 14px -6px rgba(0,0,0,0.08)';
const SUB_COLOR = '#9FABB7';

interface HomeScreenProps {
  totalCompletedSessions: number;
  statusMessage?: string;
  recentHistory: SessionRecord[];
  currentPhase?: AppPhase;
  currentSession?: FastingSession | null;
  onGoToFasting?: () => void;
  onStartFastingDirect: (config: FastingConfig) => void;
  onStartFastingFromPast: (config: FastingConfig, startTime: Date) => void;
  onStartEating?: (config: FastingConfig) => void;
  onReserveFasting: (config: FastingConfig, scheduledStart: Date) => void;
}

// ── 시간대별 인사 ─────────────────────────────────────────────
function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return '좋은 아침이에요.';
  if (h >= 12 && h < 18) return '좋은 오후에요.';
  if (h >= 18 && h < 22) return '좋은 저녁이에요.';
  return '안녕하세요.';
}

// ── 단식 종료 예상 시간 포맷 ──────────────────────────────────
function formatEndTime(fastingHours: number): string {
  const end = new Date(Date.now() + fastingHours * 60 * 60 * 1000);
  const now = new Date();
  const isToday = end.getDate() === now.getDate();
  const h = end.getHours();
  const m = end.getMinutes();
  const ampm = h < 12 ? '오전' : '오후';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m > 0 ? ` ${m}분` : '';
  const day = isToday ? '오늘' : '내일';
  return `${day} ${ampm} ${displayH}시${displayM}에 종료돼요`;
}

const ALL_TYPES: Exclude<FastingType, 'custom'>[] = ['12:12', '13:11', '14:10', '16:8', '18:6', '20:4'];

// ── 단식 중 배너 ─────────────────────────────────────────────
function FastingBanner({ session, onGoToFasting }: { session: FastingSession; onGoToFasting: () => void }) {
  const targetTime = session.fastingStartTime + session.config.fastingHours * 60 * 60 * 1000;
  const { formatted, isComplete } = useCountdown(targetTime);
  return (
    <Box
      onClick={onGoToFasting}
      sx={{
        py: '16px', px: '24px', borderRadius: '16px', bgcolor: PRIMARY,
        boxShadow: CARD_SHADOW, cursor: 'pointer', mb: '16px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}
    >
      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#4FC3F7', flexShrink: 0 }} />
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>단식 진행 중</Typography>
        <Typography sx={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', mt: '2px' }}>
          {isComplete ? '식사 가능 시간이에요!' : `식사까지 ${formatted}`}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>탭하여 이동 →</Typography>
    </Box>
  );
}

// ── 시간 선택기 ───────────────────────────────────────────────
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

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ py: '20px', borderRadius: '16px', bgcolor: 'white', boxShadow: CARD_SHADOW }}>
      <Box sx={{ mx: '24px' }}>{children}</Box>
    </Box>
  );
}

export function HomeScreen({
  totalCompletedSessions,
  statusMessage,
  currentPhase,
  currentSession,
  onGoToFasting,
  onStartFastingDirect,
  onReserveFasting,
}: HomeScreenProps) {
  const isFasting = currentPhase === 'fasting' && !!currentSession;

  const [selectedType, setSelectedType] = useState<Exclude<FastingType, 'custom'>>('16:8');
  const config = FASTING_PRESETS[selectedType];

  // 예약 drawer
  const [reserveOpen, setReserveOpen] = useState(false);
  const [reserveStep, setReserveStep] = useState(1);

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const allMinutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const [mealEndHour, setMealEndHour] = useState('');
  const [mealEndMinute, setMealEndMinute] = useState('00');

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

  // 예약 drawer step2에서 단식 패턴 선택용 별도 state
  const [reserveType, setReserveType] = useState<Exclude<FastingType, 'custom'>>('16:8');
  const reserveConfig = FASTING_PRESETS[reserveType];
  const reserveNextMeal = useMemo(() => {
    if (!mealEndDate) return null;
    return new Date(mealEndDate.getTime() + reserveConfig.fastingHours * 60 * 60 * 1000);
  }, [mealEndDate, reserveConfig]);

  const closeReserve = () => { setReserveOpen(false); setReserveStep(1); };

  const handleReserveConfirm = () => {
    if (mealEndDate) onReserveFasting(reserveConfig, mealEndDate);
    closeReserve();
  };

  const endTimeText = formatEndTime(config.fastingHours);

  const renderReserveContent = () => {
    if (reserveStep === 1) {
      return (
        <>
          <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#000', lineHeight: '24px', mb: '8px' }}>
            오늘 마지막 식사는 몇 시에 끝날까요?
          </Typography>
          <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '24px' }}>
            식사 종료 예정 시간을 기준으로 단식을 예약해요
          </Typography>
          <TimePicker
            hour={mealEndHour} minute={mealEndMinute}
            onHourChange={setMealEndHour} onMinuteChange={setMealEndMinute}
            availableHours={flowAHours} availableMinutes={flowAMinutes}
            isHourValid={isMealEndHourValid} isMinuteValid={isMealEndMinuteValid}
          />
          <Button variant="contained" fullWidth size="large"
            disabled={!isMealEndHourValid || !isMealEndMinuteValid}
            onClick={() => setReserveStep(2)} sx={{ borderRadius: '12px', mt: '24px' }}>
            다음
          </Button>
        </>
      );
    }
    if (reserveStep === 2) {
      return (
        <>
          <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#000', lineHeight: '24px', mb: '8px' }}>
            단식 패턴을 선택해주세요
          </Typography>
          <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '24px' }}>
            식사 종료: {mealEndHour}:{mealEndMinute} 기준
          </Typography>
          <ToggleButtonGroup exclusive value={reserveType} onChange={(_, v) => v && setReserveType(v)} fullWidth sx={{ mb: '16px' }}>
            {(['12:12', '14:10', '16:8', '18:6'] as const).map(t => (
              <ToggleButton key={t} value={t} sx={{ flex: 1, py: 1.5 }}>
                <Typography variant="body2" fontWeight={700}>{t}</Typography>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          {reserveNextMeal && (
            <InfoCard>
              <Typography sx={{ fontSize: '14px', color: SUB_COLOR }}>다음 식사 가능</Typography>
              <Typography sx={{ fontSize: '16px', fontWeight: 700, color: PRIMARY, mt: '4px' }}>
                {formatWallClockWithDay(reserveNextMeal)}
              </Typography>
            </InfoCard>
          )}
          <Button variant="contained" fullWidth size="large"
            onClick={() => setReserveStep(3)} sx={{ borderRadius: '12px', mt: '24px' }}>
            다음
          </Button>
        </>
      );
    }
    if (reserveStep === 3) {
      return (
        <>
          <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#000', lineHeight: '24px', mb: '8px' }}>
            단식이 예약됐어요
          </Typography>
          <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '24px' }}>
            식사를 마치면 자동으로 단식이 시작돼요
          </Typography>
          <InfoCard>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: '식사 종료 예정', value: mealEndDate ? formatWallClock(mealEndDate) : '-' },
                { label: '다음 식사', value: reserveNextMeal ? formatWallClockWithDay(reserveNextMeal) : '-', highlight: true },
              ].map(row => (
                <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '14px', color: SUB_COLOR }}>{row.label}</Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 700, color: row.highlight ? PRIMARY : '#000' }}>
                    {row.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </InfoCard>
          <Button variant="contained" fullWidth size="large"
            onClick={handleReserveConfirm} sx={{ borderRadius: '12px', mt: '24px' }}>
            예약하기
          </Button>
        </>
      );
    }
    return null;
  };

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', px: '24px', pt: '44px', pb: '100px' }}>
      {/* 단식 중 배너 */}
      {isFasting && currentSession && onGoToFasting && (
        <FastingBanner session={currentSession} onGoToFasting={onGoToFasting} />
      )}

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
        {statusMessage && (
          <Box sx={{ mt: '16px', py: '16px', borderRadius: '16px', bgcolor: PRIMARY, boxShadow: CARD_SHADOW }}>
            <Box sx={{ mx: '24px' }}>
              <Typography sx={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>{statusMessage}</Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* 카드 영역 — 단식 중일 때 비활성 */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px', opacity: isFasting ? 0.4 : 1, pointerEvents: isFasting ? 'none' : 'auto' }}>
        {/* 바로 시작 카드 (파란 배경) */}
        <Box
          sx={{
            borderRadius: '20px',
            bgcolor: PRIMARY,
            boxShadow: CARD_SHADOW,
            p: '20px',
          }}
        >
          {/* 상단: 타입 선택 + 종료 시간 */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: '16px' }}>
            {/* 타입 드롭다운 */}
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as Exclude<FastingType, 'custom'>)}
              variant="standard"
              disableUnderline
              IconComponent={(props) => (
                <Box component="span" {...props} sx={{ color: 'white !important', fontSize: '14px', top: '50%', transform: 'translateY(-50%)', right: '0 !important' }}>▾</Box>
              )}
              sx={{
                color: 'white',
                fontSize: '20px',
                fontWeight: 800,
                '.MuiSelect-select': { pr: '20px !important', pb: 0 },
              }}
              MenuProps={{ PaperProps: { sx: { maxHeight: 240 } } }}
            >
              {ALL_TYPES.map(t => (
                <MenuItem key={t} value={t}>
                  <Typography fontWeight={700}>{t}</Typography>
                </MenuItem>
              ))}
            </Select>

            {/* 종료 예상 시간 */}
            <Typography sx={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', textAlign: 'right', maxWidth: '160px', lineHeight: '18px' }}>
              {endTimeText}
            </Typography>
          </Box>

          {/* 바로 시작 버튼 */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => onStartFastingDirect(config)}
            sx={{
              borderRadius: '12px',
              bgcolor: PRIMARY_BTN,
              boxShadow: 'none',
              fontSize: '16px',
              fontWeight: 700,
              '&:hover': { bgcolor: PRIMARY_DARK, boxShadow: 'none' },
            }}
          >
            바로 시작
          </Button>
        </Box>

        {/* 예약 카드 (흰 배경) */}
        <Box
          onClick={() => { setReserveOpen(true); setReserveStep(1); }}
          sx={{
            py: '24px',
            borderRadius: '16px',
            bgcolor: 'white',
            boxShadow: CARD_SHADOW,
            cursor: 'pointer',
            '&:active': { opacity: 0.85 },
          }}
        >
          <Box sx={{ mx: '24px' }}>
            <Typography sx={{ fontSize: '18px', fontWeight: 700, color: PRIMARY, lineHeight: '24px', mb: '6px' }}>
              단식 시간을 예약할게요
            </Typography>
            <Typography sx={{ fontSize: '13px', fontWeight: 400, color: SUB_COLOR, lineHeight: '18px' }}>
              오늘 식사가 아직이라면, 식사 마칠 시간을 입력해요
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 예약 바텀 드로어 */}
      <Drawer
        anchor="bottom"
        open={reserveOpen}
        onClose={closeReserve}
        slotProps={{
          paper: { sx: { borderRadius: '24px 24px 0 0', px: '24px', pt: '8px', pb: '40px', maxHeight: '90vh', overflowY: 'auto' } },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '16px' }}>
          {reserveStep > 1
            ? <IconButton size="small" onClick={() => setReserveStep(s => s - 1)}><ArrowBackIosNewIcon fontSize="small" /></IconButton>
            : <Box sx={{ width: 36 }} />
          }
          <IconButton size="small" onClick={closeReserve}><CloseIcon fontSize="small" /></IconButton>
        </Box>
        {renderReserveContent()}
      </Drawer>
    </Box>
  );
}
