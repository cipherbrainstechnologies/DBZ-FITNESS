import { useEffect, useState } from 'react';

import { getOnboarding } from '@/src/api/client';
import { useAuth } from '@/src/auth/AuthContext';

export function useOnboardingStatus(): 'loading' | 'complete' | 'incomplete' {
  const { status } = useAuth();
  const [state, setState] = useState<'loading' | 'complete' | 'incomplete'>('loading');

  useEffect(() => {
    if (status === 'loading') {
      setState('loading');
      return;
    }
    if (status !== 'authenticated') {
      setState('incomplete');
      return;
    }
    let cancelled = false;
    void getOnboarding()
      .then(({ progress }) => {
        if (!cancelled) {
          setState(progress.completedAt ? 'complete' : 'incomplete');
        }
      })
      .catch(() => {
        if (!cancelled) setState('incomplete');
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  return state;
}
