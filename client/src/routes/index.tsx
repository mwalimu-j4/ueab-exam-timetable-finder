import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { useState, useEffect } from 'react';
import { SearchHero } from '@/components/search/SearchHero';
import { ResultCard } from '@/components/search/ResultCard';
import { MyExamsSheet } from '@/components/search/MyExamsSheet';
import { EmptyState } from '@/components/search/EmptyState';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { RatingDialog } from '@/components/rating/RatingDialog';
import { Star } from 'lucide-react';
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
    <div className="flex min-h-full flex-1 flex-col bg-surface dark:bg-[#140E24]">
      <SearchHero value={query} onChange={setQuery} />
      <main className="container mx-auto flex-1 w-full px-4 py-6 max-w-2xl mb-10">
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
      <button onClick={() => setShowRatingDialog(true)} className="fixed right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-white shadow-lg hover:scale-110 transition-transform" style={{ bottom: 'calc(84px + env(safe-area-inset-bottom))' }} aria-label="Rate your experience">
        <Star className="h-6 w-6 fill-white" />
      </button>
      <WhatsAppButton />
      
      {/* Footer */}
      <footer className="mt-auto border-t border-[#8A3FD8]/10 bg-white/70 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 text-center text-sm text-gray-600 shadow-[0_-8px_30px_rgba(138,63,216,0.05)] backdrop-blur-sm dark:border-white/10 dark:bg-[#1E1633]/80 dark:text-gray-300">
        <div className="mx-auto max-w-2xl">
          <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-brand-gradient" />
        {activeVersionDate && (
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-[#8A3FD8]">Updated {new Date(activeVersionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        )}
        <p className="font-semibold text-slate-700 dark:text-white">Made for UEAB students <span aria-hidden="true">💜</span></p>
        <p className="mt-2">
          Need help? <span className="text-slate-400">·</span>{' '}
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-whatsapp-green hover:underline"
          >
            WhatsApp {SUPPORT_PHONE_DISPLAY}
          </a>
        </p>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Developed by Joshua Mwalimu</p>
        <p className="mt-3 border-t border-slate-200/80 pt-3 text-xs text-slate-400 dark:border-white/10 dark:text-slate-500">© {new Date().getFullYear()} UEAB Exam Timetable Finder. All rights reserved.</p>
        </div>
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
