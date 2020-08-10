import { DateTime } from 'luxon';

export function formatDate(dateString) {
  const date = DateTime.fromISO(dateString);
  return date.toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS);
}
