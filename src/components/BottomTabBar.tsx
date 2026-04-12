import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import LocalDiningRoundedIcon from '@mui/icons-material/LocalDiningRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';

const PRIMARY = '#00498D';
const SUB_COLOR = '#9FABB7';

export type TabKey = 'home' | 'types' | 'records';

const TABS: { key: TabKey; label: string; Icon: React.ElementType }[] = [
  { key: 'home',    label: '홈',      Icon: HomeRoundedIcon },
  { key: 'types',   label: '단식유형', Icon: LocalDiningRoundedIcon },
  { key: 'records', label: '내 기록',  Icon: BarChartRoundedIcon },
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
        bgcolor: 'white',
        boxShadow: '0px -1px 0px rgba(0,0,0,0.06)',
        borderRadius: '12px 12px 0 0',
        display: 'flex',
        height: '80px',
        alignItems: 'flex-start',
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map(({ key, label, Icon }) => {
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
              gap: '4px',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Icon sx={{ fontSize: '24px', color: active ? PRIMARY : SUB_COLOR }} />
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
