import { useRef, useCallback } from 'react';

export function useDoubleTap(callback: () => void, delay = 350) {
  const lastTapRef = useRef<number>(0);
  
  return useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < delay) {
      callback();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [callback, delay]);
}
