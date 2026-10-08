import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api';
import type { Exam } from '@/types/api.types';

export function useExamSearch(query: string): { results: Exam[]; loading: boolean; error: string | null } {
  const [results, setResults] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
      // Abort previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<Exam[] | { results?: Exam[]; exams?: Exam[] }>('/api/exams', {
          params: { 
            q: trimmedQuery,
            _t: Date.now(), // Cache-busting timestamp
          },
          signal: abortController.signal,
        });

        // Handle both bare array and object wrapper responses
        let examsArray: Exam[] = [];
        if (Array.isArray(response.data)) {
          examsArray = response.data;
        } else if (response.data && typeof response.data === 'object') {
          examsArray = (response.data.results || response.data.exams || []) as Exam[];
        }

        if (import.meta.env.DEV) {
          console.debug('[useExamSearch] Raw response:', response.data);
          console.debug('[useExamSearch] Parsed exams:', examsArray.length, 'items');
        }

        // Students must see ALL exams in active timetable (no date filtering)
        // Sort: exact match first, then by date, then by start time
        const sorted = examsArray.sort((a, b) => {
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

        setResults(sorted);
      } catch (err: any) {
        // Ignore aborted requests
        if (err.name === 'CanceledError' || err.message?.includes('abort')) {
          return;
        }
        
        // Network error or non-2xx response
        console.error('[useExamSearch] Search failed:', err);
        setError('Couldn\'t reach the server, please try again');
        setResults([]);
      } finally {
        if (abortController === abortControllerRef.current) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query]);

  return { results, loading, error };
}
