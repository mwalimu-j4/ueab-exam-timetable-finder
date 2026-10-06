import { formatInTimeZone } from 'date-fns-tz';

const TIMEZONE = 'Africa/Nairobi';

export function getTodayInNairobi(): string {
  const now = new Date();
  return formatInTimeZone(now, TIMEZONE, 'yyyy-MM-dd');
}
