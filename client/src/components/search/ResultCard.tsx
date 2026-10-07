import { Clock, MapPin, Check, Plus } from 'lucide-react';
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

  return (
    <div className="bg-white dark:bg-[#1E1633] rounded-2xl shadow-card border-l-4 border-[#8A3FD8] p-5 animate-fadeIn">
      {/* Top row: code + day badge */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-[#8A3FD8] font-bold text-lg">{exam.code}</h3>
        {dayBadge.variant && (
          <Badge className={`${badgeVariantClass[dayBadge.variant]} text-xs font-semibold px-2 py-1`}>
            {dayBadge.label}
          </Badge>
        )}
      </div>

      {/* Title */}
      <p className="text-base font-medium text-gray-900 dark:text-gray-100 mb-3">{exam.title}</p>

      {/* Date + Time */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
        <Clock className="h-4 w-4" />
        <span>{formatExamDate(exam.date)} • {formatExamTime(exam.start, exam.end)}</span>
      </div>

      {/* Venue */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
        <MapPin className="h-4 w-4" />
        <span>{exam.building} - {exam.venue}</span>
      </div>

      {/* Option badge (only if not Main) */}
      {exam.option && exam.option !== 'Main' && (
        <div className="mb-3">
          <Badge variant="secondary" className="text-xs">
            {exam.option}
          </Badge>
        </div>
      )}

      {/* Save/Saved button */}
      <button
        onClick={() => onToggleSave(exam)}
        className={`
          w-full min-h-[44px] px-4 py-2.5 rounded-xl font-medium transition-all duration-150
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
            <Check className="h-4 w-4" />
            Saved
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            Save
          </span>
        )}
      </button>
    </div>
  );
}
