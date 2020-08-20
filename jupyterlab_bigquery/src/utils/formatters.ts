import { DateTime } from 'luxon';

export function formatDate(dateString: string) {
  const date = DateTime.fromISO(dateString);
  return date.toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS);
}

export function formatTime(dateString: string) {
  const date = DateTime.fromISO(dateString);
  return date.toLocaleString(DateTime.TIME_SIMPLE);
}

export function formatBytes(numBytes: number, numDecimals = 2) {
  if (numBytes === 0) return '0 Bytes';
  const d = Math.floor(Math.log(numBytes) / Math.log(1024));
  return (
    parseFloat((numBytes / Math.pow(1024, d)).toFixed(numDecimals)) +
    ' ' +
    ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'][d]
  );
}

export function formatMs(ms: number) {
  const days = ms / 86400000;
  return `${days} day${days > 1 ? 's' : ''} 0 hr`;
}
