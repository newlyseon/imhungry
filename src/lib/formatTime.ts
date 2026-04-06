export function formatWallClock(date: Date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const period = h >= 12 ? '오후' : '오전';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${period} ${displayH}시${m > 0 ? ` ${m.toString().padStart(2, '0')}분` : ''}`;
}

export function getDayLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diff === 0) return '오늘';
  if (diff === 1) return '내일';
  if (diff === 2) return '모레';
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatWallClockWithDay(date: Date): string {
  return `${getDayLabel(date)} ${formatWallClock(date)}`;
}

export function formatDuration(ms: number) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}시간 ${minutes}분`;
}

export function formatTimerDisplay(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)} : ${pad(m)} : ${pad(s)}`;
}

export function estimateCalories(ms: number) {
  const hours = ms / (1000 * 60 * 60);
  return Math.round(hours * 60);
}
