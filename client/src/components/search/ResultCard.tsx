import { Clock, MapPin, Check, Plus, User, Users } from 'lucide-react';
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
    <div className="bg-white dark:bg-[#1E1633] rounded-2xl shadow-card hover:shadow-xl transition-shadow duration-200 border border-gray-100 dark:border-gray-800 p-5 sm:p-6 animate-fadeIn">
      {/* Top row: code badge + day badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="inline-block bg-brand-gradient text-white px-4 py-1.5 rounded-full font-bold text-base">
          {exam.code}
        </div>
        {dayBadge.variant && (
          <Badge className={`${badgeVariantClass[dayBadge.variant]} text-xs font-semibold px-3 py-1`}>
            {dayBadge.label}
          </Badge>
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 leading-snug">
        {exam.title}
      </h3>

      {/* Info rows with icons */}
      <div className="space-y-2.5 mb-4">
        {/* Date */}
        <div className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-0.5">
            📅
          </div>
          <span className="flex-1">{formatExamDate(exam.date)}</span>
        </div>

        {/* Time */}
        <div className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
          <Clock className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{formatExamTime(exam.start, exam.end)}</span>
        </div>

        {/* Venue */}
        <div className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
          <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{venueText}</span>
        </div>

        {/* Instructor (if present) */}
        {exam.instructor && (
          <div className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
            <User className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span className="flex-1">{exam.instructor}</span>
          </div>
        )}

        {/* Student count (if present and > 0) */}
        {exam.students && exam.students > 0 && (
          <div className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
            <Users className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span className="flex-1">{exam.students} student{exam.students !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Option badge (only if not Main) */}
      {exam.option && exam.option !== 'Main' && (
        <div className="mb-4">
          <Badge variant="secondary" className="text-xs font-medium">
            {exam.option}
          </Badge>
        </div>
      )}

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
    </div>
  );
}
