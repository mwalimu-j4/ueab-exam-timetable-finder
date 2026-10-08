import { useState } from 'react';
import { X, Download, Calendar, Trash2, AlertTriangle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import type { Exam } from '@/types/api.types';
import { formatExamDate, formatExamTime } from '@/utils/dateFormat';
import { format, parseISO } from 'date-fns';

interface MyExamsSheetProps {
  saved: Exam[];
  clashes: Array<[Exam, Exam]>;
  onRemove: (id: string) => void;
  activeVersionDate?: string;
  onDownload?: () => void;
}

export function MyExamsSheet({ saved, clashes, onRemove, activeVersionDate, onDownload }: MyExamsSheetProps) {
  const [open, setOpen] = useState(false);

  if (saved.length === 0) return null;

  const handleDownloadPDF = () => {
    onDownload?.();
    // Generate a branded text download with exam details
    const lines = [
      '═══════════════════════════════════════════════',
      '     UEAB EXAM TIMETABLE FINDER',
      '          MY SAVED EXAMS',
      '═══════════════════════════════════════════════',
      '',
    ];

    const sortedExams = [...saved].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.start.localeCompare(b.start);
    });

    sortedExams.forEach((exam, idx) => {
      if (idx > 0) lines.push('───────────────────────────────────────────────');
      lines.push(`${exam.code} - ${exam.title}`);
      lines.push(`📅 Date: ${formatExamDate(exam.date)}`);
      lines.push(`⏰ Time: ${formatExamTime(exam.start, exam.end)}`);
      lines.push(`📍 Venue: ${[exam.building, exam.venue].filter(Boolean).join(' - ') || 'TBA'}`);
      if (exam.option && exam.option !== 'Main') {
        lines.push(`📝 Option: ${exam.option}`);
      }
      if (exam.instructor) {
        lines.push(`👤 Instructor: ${exam.instructor}`);
      }
      lines.push('');
    });

    lines.push('═══════════════════════════════════════════════');
    if (activeVersionDate) {
      lines.push(`Timetable last updated: ${new Date(activeVersionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`);
    }
    lines.push('Made for UEAB students 💜');
    lines.push('Developed by Joshua Mwalimu');
    lines.push('═══════════════════════════════════════════════');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-ueab-exams.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadICS = () => {
    onDownload?.();
    // Generate a .ics file with VEVENT entries
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UEAB Exam Timetable Finder//EN',
      'CALSCALE:GREGORIAN',
      'X-WR-CALNAME:My UEAB Exams',
    ];

    saved.forEach(exam => {
      // Parse date and times
      const examDate = parseISO(exam.date);
      const [startHours, startMinutes] = exam.start.split(':').map(Number);
      const [endHours, endMinutes] = exam.end.split(':').map(Number);

      const dtStart = new Date(examDate);
      dtStart.setHours(startHours, startMinutes, 0, 0);

      const dtEnd = new Date(examDate);
      dtEnd.setHours(endHours, endMinutes, 0, 0);

      // Format as YYYYMMDDTHHMMSS
      const formatICS = (date: Date): string => {
        return format(date, "yyyyMMdd'T'HHmmss");
      };

      lines.push('BEGIN:VEVENT');
      lines.push(`DTSTART:${formatICS(dtStart)}`);
      lines.push(`DTEND:${formatICS(dtEnd)}`);
      lines.push(`SUMMARY:${exam.code} Exam - ${exam.title}`);
      lines.push(`LOCATION:${[exam.building, exam.venue].filter(Boolean).join(' - ') || 'TBA'}`);
      if (exam.instructor) {
        lines.push(`DESCRIPTION:Instructor: ${exam.instructor}`);
      }
      lines.push(`UID:${exam.id}@ueab-exam-timetable`);
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');

    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-ueab-exams.ics';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Sort saved exams by date and time
  const sortedExams = [...saved].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.start.localeCompare(b.start);
  });

  return (
    <>
      {/* Floating bottom bar - centered, safe area aware */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-1/2 -translate-x-1/2 z-40 bg-brand-gradient text-white px-6 py-3 rounded-full shadow-lg font-medium hover:brightness-110 transition-all"
        style={{ bottom: 'calc(16px + env(safe-area-inset-bottom))' }}
        aria-label={`Open saved exams, ${saved.length} exam${saved.length !== 1 ? 's' : ''} saved`}
      >
        My Exams ({saved.length})
      </button>

      {/* Full-screen dialog */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content
            className="fixed inset-0 z-50 bg-surface dark:bg-[#140E24] overflow-y-auto"
            aria-describedby="saved-exams-description"
          >
            <div className="container mx-auto px-4 py-6 max-w-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white">
                  My Saved Exams
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </Dialog.Close>
              </div>

              <p id="saved-exams-description" className="sr-only">
                Your saved exams with options to download or remove them
              </p>

              {/* Clash warnings */}
              {clashes.length > 0 && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">
                        Time Conflicts Detected
                      </h3>
                      <ul className="space-y-1 text-sm text-red-800 dark:text-red-300">
                        {clashes.map(([a, b], idx) => (
                          <li key={idx}>
                            ⚠️ {a.code} and {b.code} overlap on {formatExamDate(a.date)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Exam list */}
              <div className="space-y-3 mb-6">
                {sortedExams.map(exam => (
                  <div
                    key={exam.id}
                    className="bg-white dark:bg-[#1E1633] rounded-xl shadow-sm p-4 flex items-start gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#8A3FD8] text-base mb-1">
                        {exam.code}
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                        {exam.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {formatExamDate(exam.date)} • {formatExamTime(exam.start, exam.end)}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {[exam.building, exam.venue].filter(Boolean).join(' - ') || 'Venue TBA'}
                      </p>
                    </div>
                    <button
                      onClick={() => onRemove(exam.id)}
                      className="flex-shrink-0 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      aria-label={`Remove ${exam.code}`}
                    >
                      <Trash2 className="h-5 w-5 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleDownloadPDF}
                  className="bg-brand-gradient text-white rounded-xl px-6 py-3 font-medium hover:brightness-110 hover:shadow-lg transition-all flex items-center justify-center gap-2 min-h-[48px]"
                >
                  <Download className="h-5 w-5" />
                  Download PDF
                </button>
                <button
                  onClick={handleDownloadICS}
                  className="bg-brand-gradient text-white rounded-xl px-6 py-3 font-medium hover:brightness-110 hover:shadow-lg transition-all flex items-center justify-center gap-2 min-h-[48px]"
                >
                  <Calendar className="h-5 w-5" />
                  Add to Calendar
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
