import { useEffect, useCallback } from 'react';
import { getVisitorId } from '@/lib/visitor';
import { recordVisit, recordEvent } from '@/services/tracking.service';
import type { EventType } from '@/types/api.types';

export function useVisitTracker() {
  useEffect(() => {
    const visitorId = getVisitorId();
    recordVisit(visitorId).catch(() => {
      // Swallow errors silently
    });
  }, []);

  const trackEvent = useCallback((type: EventType, query?: string) => {
    recordEvent({ type, query }).catch(() => {
      // Swallow errors silently
    });
  }, []);

  return { trackEvent };
}
