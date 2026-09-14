'use client';

import type { ReactNode } from 'react';

import { RequireMemberJourney } from '@/components/require-member-journey';

type RequireOnboardingCompleteProps = {
  children: ReactNode;
};

/** Coaching-dependent member shell — Today, Train, Fuel, Progress. */
export function RequireOnboardingComplete({ children }: RequireOnboardingCompleteProps) {
  return <RequireMemberJourney allow={['TODAY']}>{children}</RequireMemberJourney>;
}
