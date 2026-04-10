import { useFastingStore } from '@/hooks/useFastingStore';
import { HomeScreen } from '@/pages/HomeScreen';
import { ReservedScreen } from '@/pages/ReservedScreen';
import { FastingScreen } from '@/pages/FastingScreen';
import { ResultScreen } from '@/pages/ResultScreen';
import { EatingScreen } from '@/pages/EatingScreen';

const Index = () => {
  const store = useFastingStore();

  if (store.phase === 'home') {
    return (
      <HomeScreen
        totalCompletedSessions={store.totalCompletedSessions}
        statusMessage={store.lastStatusMessage}
        recentHistory={store.recentHistory}
        onStartFastingDirect={store.startFastingDirect}
        onStartFastingFromPast={store.startFastingFromPast}
        onStartEating={store.startEating}
        onReserveFasting={store.reserveFasting}
      />
    );
  }

  if (store.phase === 'reserved' && store.session) {
    return (
      <ReservedScreen
        session={store.session}
        onResetToSetup={store.resetToHome}
        onUpdateReservedStart={store.updateReservedStart}
        onUpdateReservedConfig={store.updateReservedConfig}
      />
    );
  }

  if (store.phase === 'eating' && store.session) {
    return (
      <EatingScreen
        session={store.session}
        onStartFasting={store.startFasting}
        onResetToSetup={store.resetToHome}
      />
    );
  }

  if (store.phase === 'fasting' && store.session) {
    return (
      <FastingScreen
        session={store.session}
        onEndFasting={store.endFasting}
        onResetToSetup={store.resetToHome}
        onUpdateStartTime={store.updateStartTime}
        getCurrentStage={store.getCurrentStage}
      />
    );
  }

  if (store.phase === 'result' && store.session) {
    return (
      <ResultScreen
        session={store.session}
        totalCompletedSessions={store.totalCompletedSessions}
        onGoHome={store.goHome}
      />
    );
  }

  return (
    <HomeScreen
      totalCompletedSessions={store.totalCompletedSessions}
      recentHistory={store.recentHistory || []}
      onStartFastingDirect={store.startFastingDirect}
      onStartFastingFromPast={store.startFastingFromPast}
      onStartEating={store.startEating}
      onReserveFasting={store.reserveFasting}
    />
  );
};

export default Index;
