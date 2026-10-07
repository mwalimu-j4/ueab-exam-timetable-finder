import { useState, useEffect, useCallback } from 'react';
import type { Exam } from '@/types/api.types';

const STORAGE_KEY = 'ueab-saved-exams';

function detectClashes(exams: Exam[]): Array<[Exam, Exam]> {
  const clashes: Array<[Exam, Exam]> = [];

  for (let i = 0; i < exams.length; i++) {
    for (let j = i + 1; j < exams.length; j++) {
      const a = exams[i];
      const b = exams[j];

      // Same date?
      if (a.date !== b.date) continue;

      // Parse times as minutes since midnight for comparison
      const parseTime = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const aStart = parseTime(a.start);
      const aEnd = parseTime(a.end);
      const bStart = parseTime(b.start);
      const bEnd = parseTime(b.end);

      // Check for overlap: a starts before b ends AND a ends after b starts
      if (aStart < bEnd && aEnd > bStart) {
        clashes.push([a, b]);
      }
    }
  }

  return clashes;
}

export function useSavedExams() {
  const [saved, setSaved] = useState<Exam[]>([]);
  const [clashes, setClashes] = useState<Array<[Exam, Exam]>>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Exam[];
        setSaved(parsed);
        setClashes(detectClashes(parsed));
      }
    } catch (err) {
      console.error('Failed to load saved exams:', err);
    }
  }, []);

  // Save to localStorage whenever saved changes
  const persistSaved = useCallback((exams: Exam[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
      setSaved(exams);
      setClashes(detectClashes(exams));
    } catch (err) {
      console.error('Failed to save exams:', err);
    }
  }, []);

  const save = useCallback(
    (exam: Exam) => {
      setSaved(current => {
        const exists = current.find(e => e.id === exam.id);
        if (exists) {
          // Toggle: remove if already saved
          const updated = current.filter(e => e.id !== exam.id);
          persistSaved(updated);
          return updated;
        } else {
          // Add to saved
          const updated = [...current, exam];
          persistSaved(updated);
          return updated;
        }
      });
    },
    [persistSaved]
  );

  const remove = useCallback(
    (id: string) => {
      setSaved(current => {
        const updated = current.filter(e => e.id !== id);
        persistSaved(updated);
        return updated;
      });
    },
    [persistSaved]
  );

  const isSaved = useCallback(
    (id: string) => {
      return saved.some(e => e.id === id);
    },
    [saved]
  );

  return { saved, save, remove, isSaved, clashes };
}
