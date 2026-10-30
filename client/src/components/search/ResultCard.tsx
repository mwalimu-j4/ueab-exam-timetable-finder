import { Clock, MapPin, Check, Plus, User, Users, CalendarDays, Tag } from 'lucide-react';
import type { Exam } from '@/types/api.types';
import { formatExamDate, formatExamTime, getDayBadge } from '@/utils/dateFormat';
import { Badge } from '@/components/ui/badge';

interface ResultCardProps {
  exam: Exam;
  isSaved: boolean;
  onToggleSave: (exam: Exam) => void;
}

export function ResultCard({ exam, isSaved, onToggleSave }: ResultCardProps) {
  const dayBadge = getDayBadge(exam.date);

  const badgeVariantClass = {
    today: 'bg-[#E8786B] text-white',
    tomorrow: 'bg-[#C45AAA] text-white',
    soon: 'bg-[#8A3FD8]/20 text-[#8A3FD8]',
  };

  // Safely format venue (handle null building/venue)
  const venueText = [exam.building, exam.venue].filter(Boolean).join(' - ') || 'Venue TBA';

  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card transition-shadow duration-200 hover:shadow-xl dark:border-gray-800 dark:bg-[#1E1633] sm:p-6 animate-fadeIn">
      {/* Top row: code badge + day badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="inline-block rounded-full bg-brand-gradient px-4 py-1.5 text-base font-bold text-white">
          {exam.code}
        </div>
        {dayBadge.variant && (
          <Badge className={`${badgeVariantClass[dayBadge.variant]} text-xs font-semibold px-3 py-1`}>
            {dayBadge.label}
          </Badge>
        )}
      </div>

      {/* Title */}
      <h3 className="mb-4 text-lg font-bold leading-snug text-gray-900 dark:text-gray-100">
        {exam.title}
      </h3>

      {/* Info rows with icons */}
      <div className="mb-4 grid gap-2.5 sm:grid-cols-2">
        {/* Date */}
        <div className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
        <CalendarDays className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#8A3FD8]" />
        <span className="flex-1">{formatExamDate(exam.date)}</span>
        </div>

        {/* Time */}
        <div className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
          <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#8A3FD8]" />
          <span className="flex-1">{formatExamTime(exam.start, exam.end)}</span>
        </div>

        {/* Venue */}
        <div className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
          <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#8A3FD8]" />
          <span className="flex-1">{venueText}</span>
        </div>

        <div className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
          <User className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#8A3FD8]" />
          <span className={`flex-1 ${exam.instructor ? '' : 'text-slate-400'}`}>{exam.instructor || 'Not available'}</span>
        </div>

        <div className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
          <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#8A3FD8]" />
          <span className={`flex-1 ${exam.students ? '' : 'text-slate-400'}`}>{exam.students ? `${exam.students} student${exam.students !== 1 ? 's' : ''}` : 'Not available'}</span>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 text-sm">
        <Tag className="h-4 w-4 text-[#8A3FD8]" />
        <span className="text-slate-500">Option:</span>
        <Badge variant="secondary" className="text-xs font-medium">{exam.option || 'Main / Not available'}</Badge>
      </div>

      {/* Save/Saved button */}
      <button
        onClick={() => onToggleSave(exam)}
        className={`
          w-full min-h-[48px] px-4 py-3 rounded-xl font-semibold transition-all duration-200
          ${
            isSaved
              ? 'bg-[#8A3FD8]/10 text-[#8A3FD8] hover:bg-[#8A3FD8]/20'
              : 'bg-brand-gradient text-white hover:brightness-110 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98]'
          }
        `}
        aria-label={isSaved ? `Remove ${exam.code} from saved exams` : `Save ${exam.code} to your exams`}
      >
        {isSaved ? (
          <span className="flex items-center justify-center gap-2">
            <Check className="h-5 w-5" />
            Saved
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Plus className="h-5 w-5" />
            Save Exam
          </span>
        )}
      </button>
    </article>
  );
}
