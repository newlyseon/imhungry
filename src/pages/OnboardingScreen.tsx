import { Box, Stack, Typography, TextField, Button, Slider } from '@mui/material';
import { useState } from 'react';
import type { UserProfile, FastingType } from '@/hooks/useFastingStore';

const NAVY = '#1A2952';
const BLUE = '#00498D';
const SUB_COLOR = '#9FABB7';
const DOT_INACTIVE = '#C5CDD8';
const CARD_SHADOW = '0px 7px 14px -6px rgba(0,0,0,0.08)';

type ExcludeCustom = Exclude<FastingType, 'custom'>;

// ── 단식 패턴 카드 ──────────────────────────────────────────
const PATTERN_CARDS: { type: ExcludeCustom; label: string; desc: string; color: string }[] = [
  { type: '16:8',  label: '16:8',  desc: '비움과 채움이 조화를\n이루는 일상의 균형',     color: '#00408D' },
  { type: '13:11', label: '13:11', desc: '내 몸의 자연스러운 리\n듬을 되찾는 첫걸음',     color: '#4FB286' },
  { type: '18:6',  label: '18:6',  desc: '몸 깊은 곳까지 닿는\n정화와 회복의 시간',       color: '#4E5C6E' },
  { type: '20:4',  label: '20:4',  desc: '본연의 에너지를 깨우\n는 고요하고 강력한 비움', color: '#D66D6D' },
];

// ── 성별 옵션 ────────────────────────────────────────────────
const GENDER_OPTIONS: { value: UserProfile['gender']; label: string }[] = [
  { value: 'male',   label: '남자' },
  { value: 'female', label: '여자' },
  { value: 'none',   label: '성별없음' },
  { value: 'skip',   label: '선택하지 않을게요' },
];

// ── 나이 옵션 ────────────────────────────────────────────────
const AGE_OPTIONS: { value: UserProfile['ageGroup']; label: string }[] = [
  { value: '10s',  label: '10대' },
  { value: '20s',  label: '20대' },
  { value: '30s',  label: '30대' },
  { value: '40s',  label: '40대' },
  { value: '50s',  label: '50대' },
  { value: '60s',  label: '60대' },
  { value: '70s+', label: '70대' },
  { value: '60s',  label: '80대' },
];

interface Props {
  onComplete: (profile: UserProfile, fastingType: ExcludeCustom) => void;
}

// ── 공통 선택 카드 스타일 ─────────────────────────────────────
const selectCardSx = (active: boolean) => ({
  py: '18px',
  borderRadius: '16px',
  bgcolor: active ? BLUE : 'white',
  boxShadow: CARD_SHADOW,
  cursor: 'pointer',
  transition: 'background-color 0.15s',
  '@media (prefers-contrast: more)': {
    border: `1.5px solid ${active ? BLUE : 'transparent'}`,
  },
});

export const OnboardingScreen = ({ onComplete }: Props) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [name, setName] = useState('');

  // Step 2
  const [gender, setGender] = useState<UserProfile['gender'] | null>(null);
  const [heightCm, setHeightCm] = useState<number>(165);
  const [heightUnit, setHeightUnit] = useState<'cm' | 'in'>('cm');
  const [ageGroup, setAgeGroup] = useState<UserProfile['ageGroup']>(null);

  const activeDot = step - 1;

  const handlePatternSelect = (type: ExcludeCustom) => {
    const profile: UserProfile = {
      name: name.trim(),
      gender: gender ?? 'skip',
      heightCm,
      ageGroup,
    };
    onComplete(profile, type);
  };

  const displayHeight = heightUnit === 'cm'
    ? `${heightCm} cm`
    : `${(heightCm / 2.54).toFixed(1)} in`;

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', px: '24px', pt: '44px', pb: '120px' }}>
      {/* 도트 인디케이터 */}
      <Stack direction="row" spacing="8px" sx={{ mb: '20px' }}>
        {[0, 1, 2].map((i) => (
          <Box key={i} sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: i === activeDot ? NAVY : DOT_INACTIVE }} />
        ))}
      </Stack>

      {/* ── Step 1: 이름 입력 ── */}
      {step === 1 && (
        <>
          <Typography sx={{ fontSize: '24px', fontWeight: 700, lineHeight: '32px', color: '#000', mb: '42px' }}>
            당신만의 루틴을 시작해봐요.
            <br />
            뭐라고 부르면 좋을까요?
            <br />
          </Typography>

          <TextField
            fullWidth
            placeholder="이름을 입력해주세요"
            value={name}
            onChange={(e) => setName(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '16px',
                bgcolor: 'white',
                boxShadow: CARD_SHADOW,
                '& fieldset': { border: 'none' },
              },
              '& input': { px: '24px', py: '20px', fontSize: '16px', fontWeight: 600 },
            }}
          />
        </>
      )}

      {/* ── Step 2: 기본 정보 ── */}
      {step === 2 && (
        <>
          <Typography sx={{ fontSize: '24px', fontWeight: 700, lineHeight: '32px', color: '#000', mb: '42px' }}>
            당신은 어떤 사람인가요?
            <br />
            <Box component="span" sx={{ fontSize: '16px', fontWeight: 400, color: SUB_COLOR }}>선택해주세요.</Box>
          </Typography>

          {/* 성별 */}
          <Typography sx={{ fontSize: '14px', fontWeight: 700, color: SUB_COLOR, mb: '12px' }}>성별</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', mb: '32px' }}>
            {GENDER_OPTIONS.map((opt) => (
              <Box key={opt.value} onClick={() => setGender(opt.value)} sx={selectCardSx(gender === opt.value)}>
                <Box sx={{ mx: '20px' }}>
                  <Typography sx={{ fontSize: '16px', fontWeight: 700, color: gender === opt.value ? 'white' : BLUE }}>
                    {opt.label}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* 키 */}
          <Typography sx={{ fontSize: '14px', fontWeight: 700, color: SUB_COLOR, mb: '12px' }}>키</Typography>
          <Box sx={{ py: '20px', borderRadius: '16px', bgcolor: 'white', boxShadow: CARD_SHADOW, mb: '32px' }}>
            <Box sx={{ mx: '24px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '12px' }}>
                <Typography sx={{ fontSize: '20px', fontWeight: 700, color: BLUE }}>{displayHeight}</Typography>
                <Box sx={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${DOT_INACTIVE}` }}>
                  {(['cm', 'in'] as const).map((unit) => (
                    <Box
                      key={unit}
                      onClick={() => setHeightUnit(unit)}
                      sx={{
                        px: '14px', py: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 700,
                        bgcolor: heightUnit === unit ? BLUE : 'white',
                        color: heightUnit === unit ? 'white' : SUB_COLOR,
                      }}
                    >
                      {unit}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Slider
                value={heightCm}
                onChange={(_, v) => setHeightCm(v as number)}
                min={100} max={220} step={1}
                sx={{ color: BLUE, '& .MuiSlider-thumb': { width: 20, height: 20 } }}
              />
            </Box>
          </Box>

          {/* 나이 */}
          <Typography sx={{ fontSize: '14px', fontWeight: 700, color: SUB_COLOR, mb: '12px' }}>나이</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', mb: '32px' }}>
            {AGE_OPTIONS.map((opt) => (
              <Box key={String(opt.value)} onClick={() => setAgeGroup(opt.value)} sx={selectCardSx(ageGroup === opt.value)}>
                <Box sx={{ mx: '12px' }}>
                  <Typography sx={{ fontSize: '14px', fontWeight: 700, color: ageGroup === opt.value ? 'white' : BLUE, textAlign: 'center' }}>
                    {opt.label}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

        </>
      )}

      {/* ── Floating CTA (Step 1, 2) ── */}
      {step !== 3 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            px: '24px',
            pb: '32px',
            pt: '16px',
            bgcolor: 'background.default',
          }}
        >
          <Button
            variant="contained"
            fullWidth
            size="large"
            disabled={step === 1 && name.trim().length === 0}
            onClick={() => setStep(step === 1 ? 2 : 3)}
            sx={{ borderRadius: '12px' }}
          >
            다음
          </Button>
        </Box>
      )}

      {/* ── Step 3: 단식 패턴 선택 ── */}
      {step === 3 && (
        <>
          <Typography sx={{ fontSize: '24px', fontWeight: 700, lineHeight: '32px', color: '#000', mb: '8px' }}>
            선호하는 단식 옵션을
            <br />
            선택해주세요.
          </Typography>
          <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '42px' }}>나중에 변경할 수 있어요</Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {PATTERN_CARDS.map((card) => (
              <Box
                key={card.type}
                onClick={() => handlePatternSelect(card.type)}
                sx={{
                  bgcolor: card.color,
                  borderRadius: '16px',
                  py: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  aspectRatio: '1 / 1',
                  boxShadow: '0px 7px 14px -6px rgba(0, 0, 0, 0.2)',
                  
                }}
              >
                <Box sx={{ mx: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <Typography sx={{ fontSize: '24px', fontWeight: 800, lineHeight: '17px', color: '#ffffff' }}>
                    {card.label}
                  </Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 400, lineHeight: '19px', color: '#ffffff', mt: '8px', whiteSpace: 'pre-line', flex: 1 }}>
                    {card.desc}
                  </Typography>
                  <Typography sx={{ fontSize: '18px', fontWeight: 500, lineHeight: '17px', color: 'rgba(255,255,255,0.67)', textAlign: 'right' }}>
                    시작
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};
