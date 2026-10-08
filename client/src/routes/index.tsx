import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { useState, useEffect } from 'react';
import { SearchHero } from '@/components/search/SearchHero';
import { ResultCard } from '@/components/search/ResultCard';
import { MyExamsSheet } from '@/components/search/MyExamsSheet';
import { EmptyState } from '@/components/search/EmptyState';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { RatingDialog } from '@/components/rating/RatingDialog';
import { useExamSearch } from '@/hooks/useExamSearch';
import { useSavedExams } from '@/hooks/useSavedExams';
import { useVisitTracker } from '@/hooks/useVisitTracker';
import { useRatingPrompt } from '@/hooks/useRatingPrompt';
import { apiClient } from '@/lib/api';
import { SUPPORT_PHONE_DISPLAY, WHATSAPP_LINK } from '@/lib/constants';
import type { TimetableVersion } from '@/types/api.types';
import type { StudentTimetable } from '@/types/api.types';
import { toggleStudentExam } from '@/services/student.service';

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Index,
});

function Index() {
  const [query, setQuery] = useState('');
  const { results, loading, error } = useExamSearch(query);
  const { saved, save, remove, isSaved, clashes } = useSavedExams();
  const { trackEvent } = useVisitTracker();
  const { shouldShow, markAsUsed, submitRating, dismissLater } = useRatingPrompt();
  const [activeVersionDate, setActiveVersionDate] = useState<string | undefined>();
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [cloudTimetable, setCloudTimetable] = useState<StudentTimetable | null>(null);
  useEffect(() => {
    const onCloudTimetable = (event: Event) => setCloudTimetable((event as CustomEvent<StudentTimetable>).detail);
    window.addEventListener('ueab-student-timetable', onCloudTimetable);
    return () => window.removeEventListener('ueab-student-timetable', onCloudTimetable);
  }, []);

  // Fire SEARCH event 1 second after user stops typing
  useEffect(() => {
    if (!query.trim()) return;
    const timer = setTimeout(() => {
      trackEvent('SEARCH', query);
    }, 1000);
    return () => clearTimeout(timer);
  }, [query, trackEvent]);

  // Mark as used when user searches and gets results
  useEffect(() => {
    if (results.length > 0) {
      markAsUsed();
    }
  }, [results, markAsUsed]);

  // Show rating dialog when appropriate
  useEffect(() => {
    if (shouldShow) {
      // Delay showing by 2 seconds so it doesn't interrupt immediately
      const timer = setTimeout(() => {
        setShowRatingDialog(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [shouldShow]);

  // Fetch active timetable version date for footer
  useEffect(() => {
    apiClient.get<TimetableVersion[]>('/api/admin/timetables')
      .then(res => {
        const active = res.data.find(v => v.isActive);
        if (active) setActiveVersionDate(active.uploadedAt);
      })
      .catch(() => {});
  }, []);

  const handleChipClick = (chip: string) => setQuery(chip);

  const handleSaveExam = (exam: any) => {
    save(exam);
    markAsUsed();
  };

  const showIdle = !query || query.trim().length < 2;
  const showLoading = !showIdle && loading;
  const showError = !showIdle && !loading && !!error;
  const showNoResults = !showIdle && !loading && !error && results.length === 0;
  const showResults = !showIdle && !loading && !error && results.length > 0;

  return (
    <div className="min-h-screen bg-surface dark:bg-[#140E24]">
      <SearchHero value={query} onChange={setQuery} />
      <main className="container mx-auto px-4 py-6 max-w-2xl mb-24">
        {cloudTimetable && (
          <section className="mb-6 rounded-2xl bg-white dark:bg-[#1E1633] p-5 shadow-card" aria-live="polite">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold">My timetable</h2>
              {cloudTimetable.summary.activeVersion && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cloudTimetable.summary.activeVersion.kind === 'TENTATIVE' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>{cloudTimetable.summary.activeVersion.kind === 'TENTATIVE' ? 'Tentative' : 'Final'}</span>}
            </div>
            <p className="text-sm text-gray-600 mb-4">{cloudTimetable.summary.done} of {cloudTimetable.summary.total} done · {cloudTimetable.summary.remaining} remaining</p>
            <div className="space-y-2">
              {cloudTimetable.items.map(item => item.exam ? (
                <div key={item.id} className={`flex items-center gap-3 rounded-xl border p-3 ${item.isDone ? 'opacity-60' : ''}`}>
                  <input type="checkbox" checked={item.isDone} onChange={async event => { const next = await toggleStudentExam(item.code, item.option, event.target.checked); setCloudTimetable(next); }} className="h-5 w-5" aria-label={`Mark ${item.code} done`} />
                  <div className="min-w-0"><p className={`font-semibold ${item.isDone ? 'line-through' : ''}`}>{item.code} · {item.exam.title}</p><p className="text-sm text-gray-600">{new Date(item.exam.date).toLocaleDateString('en-GB')} · {item.exam.start}–{item.exam.end} · {[item.exam.building, item.exam.venue].filter(Boolean).join(' ') || 'Venue TBA'}</p></div>
                  {item.changeFlag && <span className="ml-auto text-xs font-semibold text-amber-700">{item.changeFlag === 'REMOVED' ? 'Removed' : 'Changed'}</span>}
                </div>
              ) : <div key={item.id} className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm"> {item.code} is not in the latest timetable.</div>)}
            </div>
          </section>
        )}
        {showIdle && <EmptyState variant="idle" onChipClick={handleChipClick} />}
        {showLoading && <EmptyState variant="loading" />}
        {showError && <EmptyState variant="error" />}
        {showNoResults && <EmptyState variant="no-results" />}
        {showResults && (
          <div
            className="space-y-4"
            role="list"
            aria-label={`${results.length} exam result${results.length !== 1 ? 's' : ''}`}
          >
            {results.map(exam => (
              <div key={exam.id} role="listitem">
                <ResultCard
                  exam={exam}
                  isSaved={isSaved(exam.id)}
                  onToggleSave={handleSaveExam}
                />
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* WhatsApp Button */}
      <WhatsAppButton />
      
      {/* Footer */}
      <footer className="text-center py-12 pb-24 text-sm text-gray-500 dark:text-gray-500 space-y-2">
        {activeVersionDate && (
          <p>Timetable last updated: {new Date(activeVersionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        )}
        <p>Made for UEAB students 💜</p>
        <p>
          Need help?{' '}
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="text-whatsapp-green hover:underline font-medium"
          >
            WhatsApp {SUPPORT_PHONE_DISPLAY}
          </a>
        </p>
        <p className="text-gray-400">Developed by Joshua Mwalimu</p>
      </footer>
      
      <MyExamsSheet
        saved={saved}
        clashes={clashes}
        onRemove={remove}
        activeVersionDate={activeVersionDate}
        onDownload={markAsUsed}
      />
      
      {/* Rating Dialog */}
      <RatingDialog
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
        onSubmit={submitRating}
        onDismiss={dismissLater}
      />
    </div>
  );
}
