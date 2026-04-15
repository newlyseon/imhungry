import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import clockSelected from '@/assets/Property 1=ic_clock_selected.svg';
import fastingSelected from '@/assets/Property 1=ic_fasting_selected.svg';
import mySelected from '@/assets/Property 1=ic_my_selected.svg';

const PRIMARY = '#006ACD';
const SUB_COLOR = '#9FABB7';

export type TabKey = 'home' | 'types' | 'records';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'home',    label: '홈',      icon: clockSelected },
  { key: 'types',   label: '단식유형', icon: fastingSelected },
  { key: 'records', label: '내 기록',  icon: mySelected },
];

interface Props {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export function BottomTabBar({ activeTab, onTabChange }: Props) {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        bgcolor: 'white',
        boxShadow: '0px -1px 0px rgba(0,0,0,0.06)',
        borderRadius: '12px 12px 0 0',
        display: 'flex',
        height: '80px',
        alignItems: 'flex-start',
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map(({ key, label, icon }) => {
        const active = activeTab === key;
        return (
          <Box
            key={key}
            onClick={() => onTabChange(key)}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: '10px',
              cursor: 'pointer',
              gap: '6px',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                backgroundColor: active ? PRIMARY : SUB_COLOR,
                maskImage: `url(${icon})`,
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                maskSize: 'contain',
                WebkitMaskImage: `url(${icon})`,
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                WebkitMaskSize: 'contain',
              }}
            />
            <Typography
              sx={{
                fontSize: '11px',
                fontWeight: active ? 700 : 500,
                color: active ? PRIMARY : SUB_COLOR,
                lineHeight: 1,
              }}
            >
              {label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
