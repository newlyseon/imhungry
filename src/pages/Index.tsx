import { useState } from 'react';
import { useFastingStore } from '@/hooks/useFastingStore';
import { HomeScreen } from '@/pages/HomeScreen';
import { ResultScreen } from '@/pages/ResultScreen';
import { OnboardingScreen } from '@/pages/OnboardingScreen';
import { FastingTypeScreen } from '@/pages/FastingTypeScreen';
import { MyRecordsScreen } from '@/pages/MyRecordsScreen';
import { BottomTabBar, type TabKey } from '@/components/BottomTabBar';

// dev: ?reset=1 → localStorage 초기화 후 온보딩부터 시작
if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('reset') === '1') {
  localStorage.removeItem('fasting-app-state');
  window.history.replaceState({}, '', window.location.pathname);
}

const Index = () => {
  const store = useFastingStore();
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  // 온보딩
  if (store.phase === 'onboarding') {
    return <OnboardingScreen onComplete={store.completeOnboarding} />;
  }

  // 결과
  if (store.phase === 'result' && store.session) {
    return (
      <ResultScreen
        session={store.session}
        totalCompletedSessions={store.totalCompletedSessions}
        onGoHome={store.goHome}
      />
    );
  }

  // 홈 / 단식 중 — 탭바 상시 노출
  const renderTabContent = () => {
    if (activeTab === 'types') return <FastingTypeScreen />;
    if (activeTab === 'records') return (
      <MyRecordsScreen
        records={store.recentHistory || []}
        totalCompletedSessions={store.totalCompletedSessions}
      />
    );
    // home 탭: 홈/단식 통합 화면
    return (
      <HomeScreen
        currentPhase={store.phase}
        currentSession={store.session}
        totalCompletedSessions={store.totalCompletedSessions}
        statusMessage={store.lastStatusMessage}
        recentHistory={store.recentHistory || []}
        defaultFastingType={store.defaultFastingType}
        onStartFastingDirect={store.startFastingDirect}
        onStartFastingFromPast={store.startFastingFromPast}
        onReserveFasting={store.reserveFasting}
        onEndFasting={store.endFasting}
        onResetToSetup={store.resetToHome}
        onUpdateStartTime={store.updateStartTime}
        onUpdateReservedStart={store.updateReservedStart}
        onUpdateReservedConfig={store.updateReservedConfig}
        getCurrentStage={store.getCurrentStage}
        recurringSchedule={store.recurringSchedule}
        skippedDates={store.skippedDates}
        onSetRecurringSchedule={store.setRecurringSchedule}
        onCancelRecurringSchedule={store.cancelRecurringSchedule}
        onSkipToday={store.skipToday}
      />
    );
  };

  return (
    <>
      {renderTabContent()}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          // 단식 중 다른 탭으로 이동 시 홈 state는 유지 (session 보존)
          setActiveTab(tab);
        }}
      />
    </>
  );
};

export default Index;
