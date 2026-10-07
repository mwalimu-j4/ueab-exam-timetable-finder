import { createRoute } from '@tanstack/react-router';
import { Route as rootRoute } from './__root';
import { useState, useEffect } from 'react';
import { SearchHero } from '@/components/search/SearchHero';
import { ResultCard } from '@/components/search/ResultCard';
import { MyExamsSheet } from '@/components/search/MyExamsSheet';
import { EmptyState } from '@/components/search/EmptyState';
import { useExamSearch } from '@/hooks/useExamSearch';
import { useSavedExams } from '@/hooks/useSavedExams';
import { useVisitTracker } from '@/hooks/useVisitTracker';
import { apiClient } from '@/lib/api';
import type { TimetableVersion } from '@/types/api.types';

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
  const [activeVersionDate, setActiveVersionDate] = useState<string | undefined>();

  // Fire SEARCH event 1 second after user stops typing
  useEffect(() => {
    if (!query.trim()) return;
    const timer = setTimeout(() => {
      trackEvent('SEARCH', query);
    }, 1000);
    return () => clearTimeout(timer);
  }, [query, trackEvent]);

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

  const showIdle = !query || query.trim().length < 2;
  const showLoading = !showIdle && loading;
  const showError = !showIdle && !loading && !!error;
  const showNoResults = !showIdle && !loading && !error && results.length === 0;
  const showResults = !showIdle && !loading && !error && results.length > 0;

  return (
    <div className="min-h-screen bg-surface dark:bg-[#140E24]">
      <SearchHero value={query} onChange={setQuery} />
      <main className="container mx-auto px-4 py-6 max-w-2xl">
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
                  onToggleSave={save}
                />
              </div>
            ))}
          </div>
        )}
      </main>
      {/* Footer */}
      <footer className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
        {activeVersionDate && (
          <p>Timetable last updated: {new Date(activeVersionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        )}
        <p className="mt-1">Made for UEAB students 💜</p>
      </footer>
      <MyExamsSheet
        saved={saved}
        clashes={clashes}
        onRemove={remove}
        activeVersionDate={activeVersionDate}
      />
    </div>
  );
}
