// useAppHandoff - tiny hook that lets each app persist its UI state.
// State is namespaced per appId; saved through the global OS store
// and rehydrated automatically on next mount.

import { useCallback, useEffect, useRef } from 'react';
import { useOS } from '@/hooks/useOSStore';

export function useAppHandoff<T>(appId: string, initial: T): [T, (next: T) => void] {
  const { state, dispatch } = useOS();
  const storedRef = useRef<T>(((state.appHandoff as Record<string, T>)[appId]) ?? initial);

  const set = useCallback((next: T) => {
    storedRef.current = next;
    dispatch({ type: 'SET_APP_HANDOFF', appId, state: next });
  }, [appId, dispatch]);

  // sync ref if external state changes (e.g. import)
  useEffect(() => {
    const v = (state.appHandoff as Record<string, T>)[appId];
    if (v !== undefined) storedRef.current = v;
  }, [state.appHandoff, appId]);

  return [storedRef.current, set];
}
