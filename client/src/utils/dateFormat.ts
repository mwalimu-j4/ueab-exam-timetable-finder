import { format, parseISO, differenceInDays, startOfDay } from 'date-fns';

export function formatExamDate(dateStr: string): string {
  return format(parseISO(dateStr), 'EEE, dd MMM yyyy');
}

export function formatExamTime(start: string, end: string): string {
  // Parse HH:mm format and convert to 12-hour format
  const parseTime = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const startTime = parseTime(start);
  const endTime = parseTime(end);

  const startFormatted = format(startTime, 'h:mm a');
  const endFormatted = format(endTime, 'h:mm a');

  return `${startFormatted} – ${endFormatted}`;
}

export function getDayBadge(dateStr: string): { label: string; variant: 'today' | 'tomorrow' | 'soon' | null } {
  const examDate = startOfDay(parseISO(dateStr));
  const today = startOfDay(new Date());
  const daysDiff = differenceInDays(examDate, today);

  if (daysDiff === 0) {
    return { label: 'Today', variant: 'today' };
  } else if (daysDiff === 1) {
    return { label: 'Tomorrow', variant: 'tomorrow' };
  } else if (daysDiff > 1 && daysDiff <= 7) {
    return { label: `In ${daysDiff} days`, variant: 'soon' };
  }
  return { label: '', variant: null };
}
