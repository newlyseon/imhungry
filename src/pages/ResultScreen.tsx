import { motion } from 'framer-motion';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { Clock, Flame, TrendingUp, ExternalLink, HeartCrack } from 'lucide-react';
import { FastingSession } from '@/hooks/useFastingStore';
import { formatDuration, estimateCalories } from '@/lib/formatTime';

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

const statIcons = {
  Clock,
  Flame,
  TrendingUp,
  HeartCrack,
};

export function ResultScreen({ session, totalCompletedSessions, onGoHome }: ResultScreenProps) {
  const duration = session.completedFastingMs || 0;
  const targetMs = session.config.fastingHours * 60 * 60 * 1000;
  const achievementRate = Math.min(Math.round((duration / targetMs) * 100), 100);
  const calories = estimateCalories(duration);
  const isSuccess = duration >= targetMs;
  const products = isSuccess ? successProducts : failProducts;

  const celebrationBg = isSuccess
    ? 'hsl(45, 60%, 96%)'
    : 'hsl(210, 14%, 96%)';

  return (
    <Box
      sx={{
        height: '100vh',
        bgcolor: celebrationBg,
        px: 2.5,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ flex: 1, overflowY: 'auto', pt: 7 }}>
        {/* Header */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            {isSuccess ? (
              <>
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <Typography sx={{ fontSize: '3.75rem', mb: 2 }}>🏆</Typography>
                </motion.div>
                <Typography variant="h5" fontWeight={700} color="text.primary">
                  완벽해요! {session.config.fastingHours}시간 약속을 지켰습니다!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                  대단해요! 목표를 달성했습니다 🎉
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
                  조금 아쉽지만<br />{formatDuration(duration)} 동안 견디셨어요!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  다음엔 꼭 성공해요! 🙌
                </Typography>
              </>
            )}
          </Box>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 4 }}>
            {[
              { IconComp: Clock, label: '단식 시간', value: formatDuration(duration) },
              { IconComp: Flame, label: '소모 칼로리', value: `${calories}kcal` },
              {
                IconComp: isSuccess ? TrendingUp : HeartCrack,
                label: isSuccess ? '누적 성공' : '달성률',
                value: isSuccess ? `${totalCompletedSessions}회` : `${achievementRate}%`,
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <Card elevation={1} sx={{ textAlign: 'center', borderRadius: 3 }}>
                  <CardContent sx={{ py: 2, px: 1.5, '&:last-child': { pb: 2 } }}>
                    <stat.IconComp
                      size={18}
                      style={{ margin: '0 auto 6px', color: isSuccess ? 'hsl(0,0%,7%)' : 'hsl(215,16%,46%)' }}
                    />
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>
                      {stat.label}
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="text.primary">
                      {stat.value}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </Box>
        </motion.div>

        {/* Commerce */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
              {isSuccess ? '수고한 나에게 주는 보상 🥗' : '가벼운 간식으로 다시 준비해봐요 🍃'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {isSuccess
                ? '고생하셨어요! 혈당을 지켜주는 간식 어떠세요?'
                : '부담 없는 저칼로리 간식으로 다음 단식을 준비하세요.'
              }
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {products.map((product, i) => (
                <motion.div
                  key={product.name}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                >
                  <Card elevation={1} sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.75, px: 1.75, '&:last-child': { pb: 1.75 } }}>
                      <Box
                        sx={{
                          width: 56, height: 56,
                          borderRadius: 3,
                          bgcolor: 'action.hover',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.5rem',
                          flexShrink: 0,
                        }}
                      >
                        {product.emoji}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="text.primary"
                          noWrap
                        >
                          {product.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                          <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700 }}>
                            {product.discount}
                          </Typography>
                          <Typography variant="body2" fontWeight={700} color="text.primary">
                            {product.price}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                            {product.original}
                          </Typography>
                        </Box>
                      </Box>
                      <ExternalLink size={16} color="hsl(215,16%,60%)" style={{ flexShrink: 0 }} />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </Box>
          </Box>
        </motion.div>
      </Box>

      {/* CTA */}
      <Box sx={{ width: '100%', pb: 4, pt: 2 }}>
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={onGoHome}
            size="large"
            sx={{ borderRadius: 3 }}
          >
            홈으로 돌아가기
          </Button>
        </motion.div>
      </Box>
    </Box>
  );
}
