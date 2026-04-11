import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { SessionRecord } from '@/hooks/useFastingStore';

const PRIMARY = '#00498D';
const CARD_SHADOW = '0px 7px 14px -6px rgba(0,0,0,0.08)';
const SUB_COLOR = '#9FABB7';

function formatMs(ms: number): string {
  const h = Math.floor(ms / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

interface Props {
  records: SessionRecord[];
  totalCompletedSessions: number;
}

export function MyRecordsScreen({ records, totalCompletedSessions }: Props) {
  const sorted = [...records].reverse();
  const successCount = records.filter(r => r.isSuccess).length;

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', px: '24px', pt: '44px', pb: '100px' }}>
      <Typography sx={{ fontSize: '24px', fontWeight: 700, lineHeight: '32px', color: '#000', mb: '8px' }}>
        내 기록
      </Typography>
      <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '24px' }}>
        지금까지의 단식 기록이에요
      </Typography>

      {/* 요약 카드 */}
      <Box
        sx={{
          py: '20px',
          borderRadius: '16px',
          bgcolor: PRIMARY,
          boxShadow: CARD_SHADOW,
          mb: '24px',
        }}
      >
        <Box sx={{ mx: '24px', display: 'flex', gap: '32px' }}>
          <Box>
            <Typography sx={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', mb: '4px' }}>누적 성공</Typography>
            <Typography sx={{ fontSize: '24px', fontWeight: 800, color: 'white', lineHeight: 1 }}>
              {totalCompletedSessions}
              <Typography component="span" sx={{ fontSize: '14px', fontWeight: 500, ml: '4px' }}>회</Typography>
            </Typography>
          </Box>
          {records.length > 0 && (
            <Box>
              <Typography sx={{ fontSize: '12px', color: 'rgba(255,255,255,0.65)', mb: '4px' }}>성공률</Typography>
              <Typography sx={{ fontSize: '24px', fontWeight: 800, color: 'white', lineHeight: 1 }}>
                {Math.round((successCount / records.length) * 100)}
                <Typography component="span" sx={{ fontSize: '14px', fontWeight: 500, ml: '2px' }}>%</Typography>
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* 기록 리스트 */}
      {sorted.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: '60px' }}>
          <Typography sx={{ fontSize: '14px', color: SUB_COLOR }}>아직 기록이 없어요</Typography>
          <Typography sx={{ fontSize: '13px', color: SUB_COLOR, mt: '4px' }}>첫 단식을 시작해보세요 :)</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {sorted.map((record, i) => (
            <Box
              key={i}
              sx={{
                py: '16px',
                borderRadius: '16px',
                bgcolor: 'white',
                boxShadow: CARD_SHADOW,
              }}
            >
              <Box sx={{ mx: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mb: '4px' }}>
                    <Typography sx={{ fontSize: '16px', fontWeight: 700, color: PRIMARY }}>
                      {record.type}
                    </Typography>
                    <Box
                      sx={{
                        px: '7px',
                        py: '2px',
                        borderRadius: '20px',
                        bgcolor: record.isSuccess ? 'rgba(79,178,134,0.12)' : 'rgba(0,0,0,0.05)',
                      }}
                    >
                      <Typography sx={{ fontSize: '11px', fontWeight: 700, color: record.isSuccess ? '#4FB286' : SUB_COLOR }}>
                        {record.isSuccess ? '성공' : '중단'}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography sx={{ fontSize: '13px', color: SUB_COLOR }}>
                    {formatDate(record.timestamp)} · {formatMs(record.completedMs)} 완료
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: '20px', fontWeight: 800, color: record.isSuccess ? PRIMARY : SUB_COLOR }}>
                  {Math.round((record.completedMs / (record.fastingHours * 60 * 60 * 1000)) * 100)}%
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
