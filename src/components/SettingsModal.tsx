import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import Paper from '@mui/material/Paper';
import SettingsIcon from '@mui/icons-material/Settings';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import { FastingConfig } from '@/hooks/useFastingStore';

interface SettingsModalProps {
  currentConfig: FastingConfig;
  onResetToSetup: () => void;
  onChangeConfig?: (config: FastingConfig) => void;
  variant?: 'fasting' | 'eating';
}

export function SettingsModal({ currentConfig, onResetToSetup, variant = 'fasting' }: SettingsModalProps) {
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const isFasting = variant === 'fasting';

  const drawerSx = isFasting
    ? { bgcolor: 'rgba(10,20,15,0.92)', backdropFilter: 'blur(24px)' }
    : { bgcolor: 'hsl(145, 30%, 96%)' };

  const textColor = isFasting ? 'rgba(255,255,255,0.95)' : 'hsl(150, 30%, 10%)';
  const mutedColor = isFasting ? 'rgba(255,255,255,0.55)' : 'hsl(150, 20%, 40%)';
  const itemBg = isFasting ? 'rgba(255,255,255,0.08)' : 'hsl(145, 25%, 92%)';
  const iconBtnBg = isFasting ? 'rgba(255,255,255,0.08)' : 'hsl(145, 25%, 92%)';

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        size="small"
        sx={{
          bgcolor: iconBtnBg,
          borderRadius: 2,
          color: mutedColor,
          '&:hover': { opacity: 0.8, bgcolor: iconBtnBg },
        }}
      >
        <SettingsIcon fontSize="small" />
      </IconButton>

      {/* Settings drawer */}
      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{ sx: drawerSx }}
      >
        <Typography variant="h6" fontWeight={700} sx={{ color: textColor, mb: 0.5 }}>설정</Typography>
        <Typography variant="body2" sx={{ color: mutedColor, mb: 2 }}>
          단식 설정을 변경하거나 초기화할 수 있습니다
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Paper elevation={0} sx={{ bgcolor: itemBg, borderRadius: 2, p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TrackChangesIcon sx={{ color: mutedColor, fontSize: 18 }} />
            <Box>
              <Typography variant="caption" sx={{ color: mutedColor, display: 'block' }}>현재 목표</Typography>
              <Typography variant="body2" fontWeight={600} sx={{ color: textColor }}>
                {currentConfig.type === 'custom'
                  ? `${currentConfig.fastingHours}:${currentConfig.eatingHours}`
                  : currentConfig.type} 단식
              </Typography>
            </Box>
          </Paper>

          <Paper elevation={0} sx={{ bgcolor: itemBg, borderRadius: 2, p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AccessTimeIcon sx={{ color: mutedColor, fontSize: 18 }} />
            <Box>
              <Typography variant="caption" sx={{ color: mutedColor, display: 'block' }}>단식 / 식사</Typography>
              <Typography variant="body2" fontWeight={600} sx={{ color: textColor }}>
                {currentConfig.fastingHours}시간 / {currentConfig.eatingHours}시간
              </Typography>
            </Box>
          </Paper>

          <Box
            component="button"
            onClick={() => {
              setOpen(false);
              setTimeout(() => setConfirmReset(true), 200);
            }}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5,
              p: 1.5,
              bgcolor: itemBg,
              borderRadius: 2,
              border: 'none',
              cursor: 'pointer',
              color: mutedColor,
              transition: 'opacity 0.15s',
              '&:hover': { opacity: 0.8 },
              mt: 1,
            }}
          >
            <RotateLeftIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2" fontWeight={500} sx={{ color: mutedColor }}>
              세션 초기화 (처음부터 다시)
            </Typography>
          </Box>
        </Box>
      </Drawer>

      {/* Reset confirmation drawer */}
      <Drawer
        anchor="bottom"
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        PaperProps={{ sx: drawerSx }}
      >
        <Typography variant="h6" fontWeight={700} sx={{ color: textColor, mb: 0.5 }}>
          세션을 초기화할까요?
        </Typography>
        <Typography variant="body2" sx={{ color: mutedColor, mb: 3 }}>
          현재 기록을 삭제하고 처음부터 다시 설정합니다. 이 작업은 되돌릴 수 없습니다.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={() => setConfirmReset(false)}
            sx={{
              flex: 1,
              borderRadius: 2,
              color: mutedColor,
              borderColor: isFasting ? 'rgba(255,255,255,0.2)' : 'divider',
              '&:hover': {
                borderColor: isFasting ? 'rgba(255,255,255,0.3)' : 'divider',
                bgcolor: 'transparent',
              },
            }}
            size="large"
          >
            취소
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => { setConfirmReset(false); onResetToSetup(); }}
            sx={{ flex: 1, borderRadius: 3 }}
            size="large"
          >
            초기화
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
