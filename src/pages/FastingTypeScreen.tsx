import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const PRIMARY = '#00498D';
const CARD_SHADOW = '0px 7px 14px -6px rgba(0,0,0,0.08)';
const SUB_COLOR = '#9FABB7';

const FASTING_TYPES: {
  label: string;
  fastHours: number;
  eatHours: number;
  tag: string;
  tagColor: string;
  desc: string;
}[] = [
  { label: '12:12', fastHours: 12, eatHours: 12, tag: '입문', tagColor: '#4FB286', desc: '수면 중 자연스럽게 12시간 단식 — 처음 시작하기에 가장 쉬운 방법이에요.' },
  { label: '13:11', fastHours: 13, eatHours: 11, tag: '입문+', tagColor: '#4FB286', desc: '내 몸의 자연스러운 리듬을 되찾는 첫걸음이에요.' },
  { label: '14:10', fastHours: 14, eatHours: 10, tag: '표준', tagColor: '#00498D', desc: '하루 10시간 안에 식사를 마치고 꾸준한 리듬을 만들어가요.' },
  { label: '16:8',  fastHours: 16, eatHours: 8,  tag: '일반', tagColor: '#00498D', desc: '비움과 채움이 조화를 이루는 일상의 균형을 경험해보세요.' },
  { label: '18:6',  fastHours: 18, eatHours: 6,  tag: '집중', tagColor: '#D66D6D', desc: '몸 깊은 곳까지 닿는 정화와 회복의 시간이에요.' },
  { label: '20:4',  fastHours: 20, eatHours: 4,  tag: '고급', tagColor: '#D66D6D', desc: '본연의 에너지를 깨우는 고요하고 강력한 비움이에요.' },
];

export function FastingTypeScreen() {
  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', px: '24px', pt: '44px', pb: '100px' }}>
      <Typography sx={{ fontSize: '24px', fontWeight: 700, lineHeight: '32px', color: '#000', mb: '8px' }}>
        단식 유형
      </Typography>
      <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '32px' }}>
        각 유형의 특징을 확인해보세요
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {FASTING_TYPES.map((type) => (
          <Box
            key={type.label}
            sx={{
              py: '20px',
              borderRadius: '16px',
              bgcolor: 'white',
              boxShadow: CARD_SHADOW,
            }}
          >
            <Box sx={{ mx: '24px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '10px', mb: '8px' }}>
                <Typography sx={{ fontSize: '20px', fontWeight: 800, color: PRIMARY }}>
                  {type.label}
                </Typography>
                <Box
                  sx={{
                    px: '8px',
                    py: '2px',
                    borderRadius: '20px',
                    bgcolor: `${type.tagColor}18`,
                  }}
                >
                  <Typography sx={{ fontSize: '11px', fontWeight: 700, color: type.tagColor }}>
                    {type.tag}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: '16px', mb: '10px' }}>
                <Box>
                  <Typography sx={{ fontSize: '11px', color: SUB_COLOR, mb: '2px' }}>단식</Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#000' }}>{type.fastHours}시간</Typography>
                </Box>
                <Box sx={{ width: '1px', bgcolor: '#E5E9EF' }} />
                <Box>
                  <Typography sx={{ fontSize: '11px', color: SUB_COLOR, mb: '2px' }}>식사</Typography>
                  <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#000' }}>{type.eatHours}시간</Typography>
                </Box>
              </Box>
              <Typography sx={{ fontSize: '13px', color: SUB_COLOR, lineHeight: '18px' }}>
                {type.desc}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
