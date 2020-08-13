import { DateTime } from 'luxon';

export function formatDate(dateString) {
  const date = DateTime.fromISO(dateString);
  return date.toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS);
}

export function formatTime(dateString) {
  const date = DateTime.fromISO(dateString);
  return date.toLocaleString(DateTime.TIME_SIMPLE);
}
