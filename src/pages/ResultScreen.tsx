import { motion } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Clock, Flame, TrendingUp, HeartCrack, ExternalLink } from 'lucide-react';
import { FastingSession } from '@/hooks/useFastingStore';
import { formatDuration, estimateCalories } from '@/lib/formatTime';

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

interface ResultScreenProps {
  session: FastingSession;
  totalCompletedSessions: number;
  onGoHome: () => void;
}

const successProducts = [
  { name: '프로틴 쉐이크 (초코맛)', discount: '32%', price: '19,900원', original: '29,000원', emoji: '🥤' },
  { name: '저당 그래놀라 바', discount: '25%', price: '12,500원', original: '16,800원', emoji: '🍫' },
  { name: '유기농 견과류 믹스', discount: '20%', price: '15,200원', original: '19,000원', emoji: '🥜' },
];

const failProducts = [
  { name: '저칼로리 곤약젤리', discount: '40%', price: '8,900원', original: '14,900원', emoji: '🍬' },
  { name: '무설탕 아몬드 밀크', discount: '28%', price: '6,500원', original: '9,000원', emoji: '🥛' },
  { name: '단백질 에너지바', discount: '22%', price: '11,200원', original: '14,400원', emoji: '🍫' },
];

export function ResultScreen({ session, totalCompletedSessions, onGoHome }: ResultScreenProps) {
  const duration = session.completedFastingMs || 0;
  const targetMs = session.config.fastingHours * 60 * 60 * 1000;
  const achievementRate = Math.min(Math.round((duration / targetMs) * 100), 100);
  const calories = estimateCalories(duration);
  const isSuccess = duration >= targetMs;
  const products = isSuccess ? successProducts : failProducts;

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', px: '24px', pt: '44px', pb: '24px', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {/* 헤더 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        >
          <Box sx={{ mb: '42px' }}>
            {isSuccess ? (
              <>
                <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ delay: 0.5, duration: 0.6 }}>
                  <Typography sx={{ fontSize: '48px', mb: '12px' }}>🏆</Typography>
                </motion.div>
                <Typography sx={{ fontSize: '24px', fontWeight: 700, lineHeight: '32px', color: '#000' }}>
                  {session.config.fastingHours}시간 단식 성공!
                </Typography>
                <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mt: '6px' }}>
                  대단해요! 목표를 달성했습니다
                </Typography>
              </>
            ) : (
              <>
                <Typography sx={{ fontSize: '48px', mb: '12px' }}>🙌</Typography>
                <Typography sx={{ fontSize: '24px', fontWeight: 700, lineHeight: '32px', color: '#000' }}>
                  조금 아쉽지만<br />{formatDuration(duration)} 동안 견디셨어요!
                </Typography>
                <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mt: '6px' }}>
                  다음엔 꼭 성공해요!
                </Typography>
              </>
            )}
          </Box>
        </motion.div>

        {/* 통계 카드 3열 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', mb: '24px' }}>
            {[
              { Icon: Clock, label: '단식 시간', value: formatDuration(duration) },
              { Icon: Flame, label: '소모 칼로리', value: `${calories}kcal` },
              {
                Icon: isSuccess ? TrendingUp : HeartCrack,
                label: isSuccess ? '누적 성공' : '달성률',
                value: isSuccess ? `${totalCompletedSessions}회` : `${achievementRate}%`,
              },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }}>
                <Box sx={{ py: '20px', borderRadius: '16px', bgcolor: 'white', boxShadow: CARD_SHADOW, textAlign: 'center' }}>
                  <Box sx={{ mx: '12px' }}>
                    <stat.Icon size={18} style={{ margin: '0 auto 6px', color: PRIMARY }} />
                    <Typography sx={{ fontSize: '11px', color: SUB_COLOR, display: 'block', mb: '4px' }}>
                      {stat.label}
                    </Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#000' }}>
                      {stat.value}
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            ))}
          </Box>
        </motion.div>

        {/* 상품 추천 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Box sx={{ mb: '24px' }}>
            <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#000', mb: '8px' }}>
              {isSuccess ? '수고한 나에게 주는 보상' : '가벼운 간식으로 다시 준비해봐요'}
            </Typography>
            <Typography sx={{ fontSize: '14px', color: SUB_COLOR, mb: '16px' }}>
              {isSuccess
                ? '고생하셨어요! 혈당을 지켜주는 간식 어떠세요?'
                : '부담 없는 저칼로리 간식으로 다음 단식을 준비하세요.'}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {products.map((product, i) => (
                <motion.div key={product.name} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.1 }}>
                  <InfoCard>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Box sx={{ width: 48, height: 48, borderRadius: '12px', bgcolor: 'background.default', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                        {product.emoji}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#000' }} noWrap>
                          {product.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', mt: '4px' }}>
                          <Typography sx={{ fontSize: '12px', color: '#E53935', fontWeight: 700 }}>{product.discount}</Typography>
                          <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#000' }}>{product.price}</Typography>
                          <Typography sx={{ fontSize: '12px', color: SUB_COLOR, textDecoration: 'line-through' }}>{product.original}</Typography>
                        </Box>
                      </Box>
                      <ExternalLink size={16} color={SUB_COLOR} style={{ flexShrink: 0 }} />
                    </Box>
                  </InfoCard>
                </motion.div>
              ))}
            </Box>
          </Box>
        </motion.div>
      </Box>

      {/* CTA */}
      <Box sx={{ pt: '24px' }}>
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button variant="contained" fullWidth size="large" onClick={onGoHome} sx={{ borderRadius: '12px' }}>
            홈으로 돌아가기
          </Button>
        </motion.div>
      </Box>
    </Box>
  );
}
