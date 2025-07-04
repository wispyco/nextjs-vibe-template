import { useRef, useCallback, useLayoutEffect } from 'react';

/**
 * Returns a stable callback that always has access to the latest values
 * but doesn't cause re-renders when dependencies change
 */
export function useStableCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback);
  
  useLayoutEffect(() => {
    callbackRef.current = callback;
  });
  
  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, []) as T;
}