import { useState } from 'react';
import { Settings, RotateCcw, Clock, Target } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { FastingConfig, FastingType, FASTING_PRESETS } from '@/hooks/useFastingStore';

interface SettingsModalProps {
  currentConfig: FastingConfig;
  onResetToSetup: () => void;
  onChangeConfig?: (config: FastingConfig) => void;
  variant?: 'fasting' | 'eating';
}

const typeOptions: { type: FastingType; label: string }[] = [
  { type: '12:12', label: '12:12 (입문)' },
  { type: '16:8', label: '16:8 (일반)' },
  { type: '18:6', label: '18:6 (상급)' },
];

export function SettingsModal({ currentConfig, onResetToSetup, variant = 'fasting' }: SettingsModalProps) {
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const isFasting = variant === 'fasting';
  const textClass = isFasting ? 'text-fasting' : 'text-eating';
  const mutedClass = isFasting ? 'text-fasting-muted' : 'text-eating-muted';
  const bgClass = isFasting ? 'bg-fasting-secondary backdrop-blur-md' : 'bg-eating-secondary';
  const sheetBg = isFasting ? 'bg-fasting-heavy backdrop-blur-xl' : 'bg-eating';
  const cancelBorderClass = isFasting ? 'border-fasting-ring' : 'border-border';

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button className={`p-2 rounded-xl ${bgClass} ${mutedClass} hover:opacity-80 transition-opacity`}>
            <Settings size={20} />
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className={`rounded-t-3xl px-5 pb-8 pt-6 ${sheetBg} border-0`}>
          <SheetHeader className="text-left mb-4">
            <SheetTitle className={`text-lg font-bold ${textClass}`}>설정</SheetTitle>
            <SheetDescription className={`text-sm ${mutedClass}`}>단식 설정을 변경하거나 초기화할 수 있습니다</SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-3 mt-2">
            {/* Current info */}
            <div className={`flex items-center gap-3 p-3 rounded-xl ${bgClass}`}>
              <Target size={18} className={mutedClass} />
              <div>
                <p className={`text-xs ${mutedClass}`}>현재 목표</p>
                <p className={`text-sm font-semibold ${textClass}`}>
                  {currentConfig.type === 'custom'
                    ? `${currentConfig.fastingHours}:${currentConfig.eatingHours}`
                    : currentConfig.type} 단식
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-xl ${bgClass}`}>
              <Clock size={18} className={mutedClass} />
              <div>
                <p className={`text-xs ${mutedClass}`}>단식 / 식사</p>
                <p className={`text-sm font-semibold ${textClass}`}>
                  {currentConfig.fastingHours}시간 / {currentConfig.eatingHours}시간
                </p>
              </div>
            </div>

            {/* Reset button */}
            <button
              onClick={() => {
                setOpen(false);
                setTimeout(() => setConfirmReset(true), 200);
              }}
              className={`flex items-center gap-3 p-3 rounded-xl ${bgClass} ${mutedClass} hover:opacity-80 transition-opacity mt-2`}
            >
              <RotateCcw size={18} />
              <span className="text-sm font-medium">세션 초기화 (처음부터 다시)</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Reset confirmation */}
      <Sheet open={confirmReset} onOpenChange={setConfirmReset}>
        <SheetContent side="bottom" className={`rounded-t-3xl px-5 pb-8 pt-6 ${sheetBg} border-0`}>
          <SheetHeader className="text-left mb-5">
            <SheetTitle className={`text-lg font-bold ${textClass}`}>세션을 초기화할까요?</SheetTitle>
            <SheetDescription className={`text-sm ${mutedClass}`}>
              현재 기록을 삭제하고 처음부터 다시 설정합니다. 이 작업은 되돌릴 수 없습니다.
            </SheetDescription>
          </SheetHeader>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmReset(false)}
              className={`flex-1 py-[16px] rounded-xl border ${cancelBorderClass} ${mutedClass} font-semibold text-base`}
            >
              취소
            </button>
            <button
              onClick={() => { setConfirmReset(false); onResetToSetup(); }}
              className="flex-1 py-[16px] rounded-xl bg-destructive text-destructive-foreground font-semibold text-base"
            >
              초기화
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
