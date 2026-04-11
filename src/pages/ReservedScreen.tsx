import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Chip from '@mui/material/Chip';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { FastingSession, FastingType, FASTING_PRESETS, FastingConfig } from '@/hooks/useFastingStore';
import { useCountdown } from '@/hooks/useCountdown';
import { formatWallClock, formatWallClockWithDay } from '@/lib/formatTime';

const PRIMARY = '#00498D';
const CARD_SHADOW = '0px 7px 14px -6px rgba(0,0,0,0.08)';
const SUB_COLOR = '#9FABB7';

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ py: '20px', borderRadius: '16px', bgcolor: 'white', boxShadow: CARD_SHADOW }}>
      <Box sx={{ mx: '24px' }}>{children}</Box>
    </Box>
  );
}

const TYPES: { type: Exclude<FastingType, 'custom'>; label: string; subtitle: string }[] = [
  { type: '12:12', label: '12:12', subtitle: '입문' },
  { type: '16:8',  label: '16:8',  subtitle: '일반' },
  { type: '18:6',  label: '18:6',  subtitle: '상급' },
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

  const currentType = session.config.type === 'custom' ? '16:8' : session.config.type as Exclude<FastingType, 'custom'>;
  const [selectedRoutine, setSelectedRoutine] = useState<Exclude<FastingType, 'custom'>>(currentType);

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', px: '24px', pt: '44px', pb: '24px', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {/* 헤더 */}
        <Box sx={{ mb: '42px' }}>
          <Typography sx={{ fontSize: '24px', fontWeight: 700, lineHeight: '32px', color: '#000' }}>
            단식 예약 중
          </Typography>
          <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mt: '6px' }}>
            {session.config.type === 'custom'
              ? `${session.config.fastingHours}:${session.config.eatingHours}`
              : session.config.type} · {formatWallClock(reservedDate)} 시작
          </Typography>
        </Box>

        {/* 카운트다운 */}
        <Box sx={{ textAlign: 'center', mb: '42px' }}>
          <Typography sx={{ fontSize: '48px', mb: '8px' }}>🍽️</Typography>
          <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#000' }}>
            {isComplete ? '곧 단식이 시작됩니다...' : (
              <>단식 시작까지{' '}
                <Box component="span" sx={{ color: PRIMARY }}>{formatted}</Box>
                {' '}남았어요
              </>
            )}
          </Typography>
          <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mt: '8px' }}>
            좋아하는 음식, 맛있게 드세요.
          </Typography>
        </Box>

        {/* 예약 정보 카드 */}
        <InfoCard>
          <Typography sx={{ fontSize: '14px', fontWeight: 700, color: SUB_COLOR, mb: '16px' }}>
            예약 정보
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: '단식 루틴', value: session.config.type === 'custom' ? '커스텀' : session.config.type, onEdit: () => setShowChangeRoutine(true) },
              { label: '단식 시작', value: formatWallClock(reservedDate), onEdit: () => setShowChangeTime(true) },
              { label: '식사 가능', value: formatWallClockWithDay(fastingEndDate) + '부터', highlight: true },
            ].map(row => (
              <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '14px', color: SUB_COLOR }}>{row.label}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Typography sx={{ fontSize: '14px', fontWeight: 700, color: row.highlight ? PRIMARY : '#000' }}>
                    {row.value}
                  </Typography>
                  {row.onEdit && (
                    <Chip
                      label="변경"
                      size="small"
                      onClick={row.onEdit}
                      sx={{ fontSize: '11px', height: 24, fontWeight: 600, bgcolor: PRIMARY, color: 'white', cursor: 'pointer' }}
                    />
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </InfoCard>
      </Box>

      {/* CTA */}
      <Box sx={{ pt: '24px' }}>
        <Button variant="outlined" fullWidth size="large"
          onClick={onResetToSetup}
          sx={{ borderRadius: '12px', borderColor: PRIMARY, color: PRIMARY }}>
          예약 취소
        </Button>
      </Box>

      {/* 시간 변경 Drawer */}
      <Drawer anchor="bottom" open={showChangeTime} onClose={() => setShowChangeTime(false)}
        slotProps={{ paper: { sx: { borderRadius: '24px 24px 0 0', px: '24px', pt: '24px', pb: '40px' } } }}>
        <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#000', mb: '8px' }}>
          단식 시작 시간 변경
        </Typography>
        <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '24px' }}>
          새로운 시작 시간을 설정하세요
        </Typography>
        <ToggleButtonGroup exclusive value={day} onChange={(_, v) => v && setDay(v)} fullWidth sx={{ mb: '16px' }}>
          <ToggleButton value="today" sx={{ flex: 1, py: 1.5 }}>오늘</ToggleButton>
          <ToggleButton value="tomorrow" sx={{ flex: 1, py: 1.5 }}>내일</ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: '16px' }}>
          <FormControl>
            <Select value={isHourValid ? editHour : ''} onChange={(e) => setEditHour(e.target.value)}
              displayEmpty sx={{ width: 96, height: 56, textAlign: 'center', fontWeight: 700, fontSize: '1.25rem' }}
              renderValue={(v) => v || '--'}>
              {availableHours.map(i => { const label = i.toString().padStart(2, '0'); return <MenuItem key={i} value={label}>{label}시</MenuItem>; })}
            </Select>
          </FormControl>
          <Typography variant="h5" fontWeight={700}>:</Typography>
          <FormControl>
            <Select value={isMinuteValid ? editMinute : ''} onChange={(e) => setEditMinute(e.target.value)}
              displayEmpty sx={{ width: 96, height: 56, textAlign: 'center', fontWeight: 700, fontSize: '1.25rem' }}
              renderValue={(v) => v || '--'}>
              {availableMinutes.map(m => { const val = m.toString().padStart(2, '0'); return <MenuItem key={m} value={val}>{val}분</MenuItem>; })}
            </Select>
          </FormControl>
        </Box>
        {newScheduledDate && (
          <InfoCard>
            <Typography sx={{ fontSize: '14px', color: SUB_COLOR }}>변경 후 식사 가능</Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 700, color: PRIMARY, mt: '4px' }}>
              {formatWallClockWithDay(new Date(newScheduledDate.getTime() + session.config.fastingHours * 60 * 60 * 1000))}
            </Typography>
          </InfoCard>
        )}
        <Button variant="contained" fullWidth size="large" disabled={!newScheduledDate}
          onClick={() => { if (newScheduledDate) { onUpdateReservedStart(newScheduledDate); setShowChangeTime(false); } }}
          sx={{ borderRadius: '12px', mt: '24px' }}>
          시간 변경하기
        </Button>
      </Drawer>

      {/* 루틴 변경 Drawer */}
      <Drawer anchor="bottom" open={showChangeRoutine} onClose={() => setShowChangeRoutine(false)}
        slotProps={{ paper: { sx: { borderRadius: '24px 24px 0 0', px: '24px', pt: '24px', pb: '40px' } } }}>
        <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#000', mb: '8px' }}>
          단식 루틴 변경
        </Typography>
        <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '24px' }}>
          변경할 단식 루틴을 선택하세요
        </Typography>
        <ToggleButtonGroup exclusive value={selectedRoutine}
          onChange={(_, v) => v && setSelectedRoutine(v)} fullWidth sx={{ mb: '24px' }}>
          {TYPES.map(t => (
            <ToggleButton key={t.type} value={t.type} sx={{ flex: 1, py: 1.5, flexDirection: 'column', gap: 0.25 }}>
              <Typography variant="body2" fontWeight={700}>{t.label}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.75 }}>{t.subtitle}</Typography>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Button variant="contained" fullWidth size="large"
          onClick={() => { onUpdateReservedConfig(FASTING_PRESETS[selectedRoutine]); setShowChangeRoutine(false); }}
          sx={{ borderRadius: '12px' }}>
          루틴 변경하기
        </Button>
      </Drawer>
    </Box>
  );
}
