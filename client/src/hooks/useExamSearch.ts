import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { Exam } from '@/types/api.types';
import { startOfDay, parseISO } from 'date-fns';

export function useExamSearch(query: string): { results: Exam[]; loading: boolean; error: string | null } {
  const [results, setResults] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmedQuery = query.trim();

    // Clear results if query is too short
    if (trimmedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Debounce: wait 300ms after user stops typing
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<Exam[]>('/api/exams', {
          params: { q: trimmedQuery },
        });

        const today = startOfDay(new Date());

        // Filter out past exams and sort
        const filtered = response.data
          .filter(exam => {
            const examDate = startOfDay(parseISO(exam.date));
            return examDate >= today;
          })
          .sort((a, b) => {
            // Exact code match first (case-insensitive)
            const aExact = a.code.toLowerCase() === trimmedQuery.toLowerCase();
            const bExact = b.code.toLowerCase() === trimmedQuery.toLowerCase();
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;

            // Then by date
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;

            // Then by start time
            return a.start.localeCompare(b.start);
          });

        setResults(filtered);
      } catch (err: any) {
        setError('Unable to search. Please check your connection and try again.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return { results, loading, error };
}
