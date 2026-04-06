import { motion } from 'framer-motion';
import { Trophy, Clock, Flame, TrendingUp, ExternalLink, HeartCrack, Home } from 'lucide-react';
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

export function ResultScreen({ session, totalCompletedSessions, onGoHome }: ResultScreenProps) {
  const duration = session.completedFastingMs || 0;
  const targetMs = session.config.fastingHours * 60 * 60 * 1000;
  const achievementRate = Math.min(Math.round((duration / targetMs) * 100), 100);
  const calories = estimateCalories(duration);
  const isSuccess = duration >= targetMs;
  const products = isSuccess ? successProducts : failProducts;

  return (
    <div className={`h-screen px-5 flex flex-col overflow-hidden ${isSuccess ? 'bg-celebration' : 'bg-background'}`}>
      <div className="flex-1 overflow-y-auto pt-[56px]">
        {/* Header */}
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }} className="text-center mb-8">
          {isSuccess ? (
            <>
              <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ delay: 0.5, duration: 0.6 }} className="text-6xl mb-4">🏆</motion.div>
              <h1 className="text-2xl font-bold text-foreground">완벽해요! {session.config.fastingHours}시간 약속을 지켰습니다!</h1>
              <p className="text-muted-foreground mt-1">대단해요! 목표를 달성했습니다 🎉</p>
            </>
          ) : (
            <>
              
              <h1 className="text-2xl font-bold text-foreground">조금 아쉽지만<br />{formatDuration(duration)} 동안 견디셨어요!</h1>
              <p className="text-muted-foreground mt-1">다음엔 꼭 성공해요! 🙌</p>
            </>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: Clock, label: '단식 시간', value: formatDuration(duration) },
            { icon: Flame, label: '소모 칼로리', value: `${calories}kcal` },
            { icon: isSuccess ? TrendingUp : HeartCrack, label: isSuccess ? '누적 성공' : '달성률', value: isSuccess ? `${totalCompletedSessions}회` : `${achievementRate}%` },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="bg-card rounded-2xl p-3.5 text-center shadow-card">
              <stat.icon size={18} className={`mx-auto mb-1.5 ${isSuccess ? 'text-foreground' : 'text-muted-foreground'}`} />
              <p className="text-xs text-muted-foreground mb-0.5">{stat.label}</p>
              <p className="text-sm font-bold text-foreground">{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Commerce */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mb-8">
          <h2 className="text-base font-bold text-foreground mb-1">
            {isSuccess ? '수고한 나에게 주는 보상 🥗' : '가벼운 간식으로 다시 준비해봐요 🍃'}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {isSuccess ? '고생하셨어요! 혈당을 지켜주는 간식 어떠세요?' : '부담 없는 저칼로리 간식으로 다음 단식을 준비하세요.'}
          </p>
          <div className="flex flex-col gap-3">
            {products.map((product, i) => (
              <motion.div key={product.name} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.1 }} className="flex items-center gap-3 bg-card rounded-2xl p-3.5 shadow-card">
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0">{product.emoji}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-destructive text-xs font-bold">{product.discount}</span>
                    <span className="text-sm font-bold text-foreground">{product.price}</span>
                    <span className="text-xs text-muted-foreground line-through">{product.original}</span>
                  </div>
                </div>
                <ExternalLink size={16} className="text-muted-foreground shrink-0" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* CTA */}
      <div className="w-full pb-8 pt-4">
        <motion.button whileTap={{ scale: 0.97 }} onClick={onGoHome} className="w-full rounded-xl bg-primary text-primary-foreground font-semibold text-base py-[16px]">
          홈으로 돌아가기
        </motion.button>
      </div>
    </div>
  );
}
