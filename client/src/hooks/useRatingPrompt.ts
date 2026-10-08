import { useState, useCallback } from 'react';
import { submitRating } from '@/services/rating.service';

const HAS_USED_APP_KEY = 'ueab_has_used_app';
const HAS_RATED_KEY = 'ueab_has_rated';
const MAYBE_LATER_KEY = 'ueab_rating_maybe_later';
const CLIENT_ID_KEY = 'ueab_client_id';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function getOrCreateClientId(): string {
  let clientId = localStorage.getItem(CLIENT_ID_KEY);
  if (!clientId) {
    // Use crypto.randomUUID if available, else fallback
    clientId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `client_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(CLIENT_ID_KEY, clientId);
  }
  return clientId;
}

function detectUserAgentType(): string {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('mobile') ? 'mobile' : 'desktop';
}

export function useRatingPrompt() {
  const [hasUsedApp, setHasUsedApp] = useState(() => {
    return localStorage.getItem(HAS_USED_APP_KEY) === 'true';
  });

  const [hasRated, setHasRated] = useState(() => {
    return localStorage.getItem(HAS_RATED_KEY) === 'true';
  });

  const [maybeLaterTimestamp, setMaybeLaterTimestamp] = useState<number | null>(() => {
    const stored = localStorage.getItem(MAYBE_LATER_KEY);
    return stored ? parseInt(stored, 10) : null;
  });

  // Calculate if we should show the rating dialog
  const shouldShow = hasUsedApp && !hasRated && (
    !maybeLaterTimestamp || (Date.now() - maybeLaterTimestamp > THREE_DAYS_MS)
  );

  const markAsUsed = useCallback(() => {
    localStorage.setItem(HAS_USED_APP_KEY, 'true');
    setHasUsedApp(true);
  }, []);

  const handleSubmitRating = useCallback(async (stars: number, comment?: string) => {
    const clientId = getOrCreateClientId();
    const userAgentType = detectUserAgentType();

    await submitRating({
      stars,
      comment,
      clientId,
      userAgentType,
    });

    localStorage.setItem(HAS_RATED_KEY, 'true');
    setHasRated(true);
  }, []);

  const dismissLater = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(MAYBE_LATER_KEY, now.toString());
    setMaybeLaterTimestamp(now);
  }, []);

  return {
    shouldShow,
    markAsUsed,
    submitRating: handleSubmitRating,
    dismissLater,
  };
}
