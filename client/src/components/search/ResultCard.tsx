import { Calendar, Clock, MapPin, Check, Plus, User, Users } from 'lucide-react';
import type { Exam } from '@/types/api.types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface ResultCardProps {
  exam: Exam;
  isSaved: boolean;
  onToggleSave: (exam: Exam) => void;
}

function formatExamTime(start: string, end: string): string {
  // Format as 12-hour time (e.g., "2:00 PM - 4:00 PM")
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  return `${formatTime(start)} - ${formatTime(end)}`;
}

export function ResultCard({ exam, isSaved, onToggleSave }: ResultCardProps) {
  // Format date with weekday (e.g., "Friday, 15 December 2023")
  const formattedDate = format(new Date(exam.date), 'EEEE, d MMMM yyyy');
  
  // Safely format venue (handle null building/venue)
  const venueText = [exam.building, exam.venue].filter(Boolean).join(' - ') || 'Venue TBA';

  return (
    <div className="bg-white dark:bg-[#1E1633] rounded-2xl shadow-card p-5 animate-fadeIn hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
      {/* Gradient badge for course code */}
      <div className="inline-block mb-3">
        <div className="bg-brand-gradient px-4 py-2 rounded-lg">
          <h3 className="text-white font-bold text-lg">{exam.code}</h3>
        </div>
      </div>

      {/* Title - bold and wrapping */}
      <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 leading-snug break-words">
        {exam.title}
      </p>

      {/* Icon rows */}
      <div className="space-y-2.5 mb-4">
        {/* Date with weekday */}
        <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
          <Calendar className="h-4 w-4 flex-shrink-0 text-[#7C3AED]" />
          <span className="break-words">{formattedDate}</span>
        </div>

        {/* Time in 12-hour format */}
        <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
          <Clock className="h-4 w-4 flex-shrink-0 text-[#7C3AED]" />
          <span>{formatExamTime(exam.start, exam.end)}</span>
        </div>

        {/* Venue */}
        <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
          <MapPin className="h-4 w-4 flex-shrink-0 text-[#7C3AED]" />
          <span className="break-words">{venueText}</span>
        </div>

        {/* Instructor (only if present) */}
        {exam.instructor && (
          <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
            <User className="h-4 w-4 flex-shrink-0 text-[#7C3AED]" />
            <span className="break-words">{exam.instructor}</span>
          </div>
        )}

        {/* Student count (only if present and > 0) */}
        {exam.students && exam.students > 0 && (
          <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
            <Users className="h-4 w-4 flex-shrink-0 text-[#7C3AED]" />
            <span>{exam.students} student{exam.students !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Option chip (only if not Main) */}
      {exam.option && exam.option !== 'Main' && (
        <div className="mb-4">
          <Badge variant="secondary" className="text-xs font-medium">
            {exam.option}
          </Badge>
        </div>
      )}

      {/* Save/Saved button with 44px tap target */}
      <button
        onClick={() => onToggleSave(exam)}
        className={`
          w-full min-h-[44px] px-4 py-2.5 rounded-xl font-medium transition-all duration-200
          ${
            isSaved
              ? 'bg-[#7C3AED]/10 text-[#7C3AED] hover:bg-[#7C3AED]/20 scale-100'
              : 'bg-brand-gradient text-white hover:brightness-110 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
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
