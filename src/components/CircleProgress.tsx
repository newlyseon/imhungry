import { motion } from 'framer-motion';

interface CircleProgressProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  children: React.ReactNode;
  colorClass?: 'fasting' | 'eating';
}

export function CircleProgress({
  progress,
  size = 280,
  strokeWidth = 10,
  children,
  colorClass = 'fasting',
}: CircleProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(progress, 1));

  const strokeColor = colorClass === 'fasting'
    ? 'hsl(var(--fasting-accent))'
    : '#00498D';

  const trackColor = colorClass === 'fasting'
    ? 'rgba(255,255,255,0.15)'
    : 'rgba(0, 73, 141, 0.12)';

  const glowFilter = colorClass === 'fasting'
    ? 'drop-shadow(0 0 12px hsl(0 0% 100% / 0.4))'
    : 'drop-shadow(0 0 12px rgba(0, 73, 141, 0.35))';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ filter: glowFilter }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
