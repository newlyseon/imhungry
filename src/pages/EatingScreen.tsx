import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { CircleProgress } from '@/components/CircleProgress';
import { SettingsModal } from '@/components/SettingsModal';
import { useCountdown, useElapsed } from '@/hooks/useCountdown';
import { FastingSession } from '@/hooks/useFastingStore';
import { formatWallClock, formatTimerDisplay, formatWallClockWithDay } from '@/lib/formatTime';

const PRIMARY = '#006ACD';
const CARD_SHADOW = '0px 7px 14px -6px rgba(0,0,0,0.08)';
const SUB_COLOR = '#9FABB7';

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ py: '20px', borderRadius: '16px', bgcolor: 'white', boxShadow: CARD_SHADOW }}>
      <Box sx={{ mx: '24px' }}>{children}</Box>
    </Box>
  );
}

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
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', px: '24px', pt: '44px', pb: '24px', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {/* 헤더 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: '42px' }}>
          <Box>
            <Typography sx={{ fontSize: '24px', fontWeight: 700, lineHeight: '32px', color: '#000' }}>
              식사 중
            </Typography>
            <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mt: '6px' }}>
              {session.config.type === 'custom'
                ? `${session.config.fastingHours}:${session.config.eatingHours}`
                : session.config.type} · 식사 시간
            </Typography>
          </Box>
          <SettingsModal currentConfig={session.config} onResetToSetup={onResetToSetup} variant="eating" />
        </Box>

        {/* 식사 종료 안내 카드 */}
        <InfoCard>
          <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#000' }}>
            <Box component="span" sx={{ color: PRIMARY }}>{formatWallClock(new Date(eatingEnd))}</Box>
            {' '}에 마지막 식사를 마치세요
          </Typography>
          <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mt: '6px' }}>
            맛있게 드시고 계신가요?
          </Typography>
        </InfoCard>

        {/* 원형 프로그레스 */}
        <Box sx={{ my: '32px', display: 'flex', justifyContent: 'center' }}>
          <CircleProgress progress={progress} colorClass="eating">
            <Typography sx={{ fontSize: '12px', color: SUB_COLOR, mb: '4px' }}>
              {isComplete ? '식사 시간 종료!' : showElapsed ? '경과 시간' : '식사 종료까지'}
            </Typography>
            <Box
              component="button"
              onClick={() => setShowElapsed(prev => !prev)}
              sx={{
                fontSize: '2.25rem', fontWeight: 700, color: '#000',
                fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
                bgcolor: 'transparent', border: 'none', cursor: 'pointer',
                '&:active': { opacity: 0.6 },
              }}
            >
              {isComplete ? '00 : 00 : 00' : showElapsed ? elapsedFormatted : formatted}
            </Box>
            {!isComplete && (
              <Typography sx={{ fontSize: '12px', color: SUB_COLOR, mt: '4px' }}>
                {showElapsed
                  ? `시작: ${formatWallClock(new Date(eatingStart))}`
                  : `종료 예정: ${formatWallClock(new Date(eatingEnd))}`}
              </Typography>
            )}
          </CircleProgress>
        </Box>

        {/* 다음 단식 안내 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <InfoCard>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography sx={{ fontSize: '14px', color: SUB_COLOR }}>단식 시작</Typography>
                <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#000', mt: '4px' }}>
                  <Box component="span" sx={{ color: PRIMARY }}>{formatWallClock(new Date(eatingEnd))}</Box>
                  {' '}이후 자동 시작
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '24px' }}>🌙</Typography>
            </Box>
            <Typography sx={{ fontSize: '13px', color: SUB_COLOR, mt: '8px' }}>
              {session.config.fastingHours}시간 단식 → {formatWallClockWithDay(nextFastingEnd)} 식사 가능
            </Typography>
          </InfoCard>

          <InfoCard>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Typography sx={{ fontSize: '24px' }}>🥚</Typography>
              <Box>
                <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#000' }}>
                  단식 시작 전, 단백질 간식을 챙겨보세요
                </Typography>
                <Typography sx={{ fontSize: '13px', color: SUB_COLOR, mt: '4px' }}>
                  포만감을 오래 유지해줘요
                </Typography>
              </Box>
            </Box>
          </InfoCard>
        </Box>
      </Box>

      {/* CTA */}
      <Box sx={{ pt: '24px' }}>
        <Button
          variant="contained"
          fullWidth
          onClick={onStartFasting}
          size="large"
          sx={{ borderRadius: '12px', '&&': { height: '50px' } }}
        >
          지금 바로 단식 시작
        </Button>
        <Typography sx={{ fontSize: '12px', textAlign: 'center', color: SUB_COLOR, mt: '12px' }}>
          식사를 일찍 마쳤다면 다음 사이클로 바로 진입하세요
        </Typography>
      </Box>
    </Box>
  );
}
