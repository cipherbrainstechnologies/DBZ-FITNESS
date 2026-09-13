import { Inject, Injectable, forwardRef } from '@nestjs/common';
import type { SaveOnboardingStep } from '@saiyan/contracts';

import { esmForwardRef } from '../common/esm-forward-ref.js';
import type {
  OnboardingApplicationService,
  DietPreferenceSummary,
  OnboardingProgressView,
  ScreeningSummary,
} from './onboarding.application.service.js';

export type { DietPreferenceSummary };

/**
 * Cross-module façade for onboarding, screening, consent, and diet preference.
 * Training/Nutrition modules must depend on this — not Consent/Screening/Diet entities.
 */
@Injectable()
export class OnboardingFacade {
  constructor(
    @Inject(
      forwardRef(
        esmForwardRef<OnboardingApplicationService>(
          import.meta.url,
          './onboarding.application.service.js',
          'OnboardingApplicationService',
        ),
      ),
    )
    private readonly onboarding: OnboardingApplicationService,
  ) {}

  getProgress(userId: string): Promise<OnboardingProgressView> {
    return this.onboarding.getProgress(userId);
  }

  saveStep(userId: string, body: SaveOnboardingStep): Promise<OnboardingProgressView> {
    return this.onboarding.saveStep(userId, body);
  }

  complete(userId: string): Promise<OnboardingProgressView> {
    return this.onboarding.complete(userId);
  }

  getLatestScreeningSummary(userId: string): Promise<ScreeningSummary | null> {
    return this.onboarding.getLatestScreeningSummary(userId);
  }

  getScreeningSummaryByIdForUser(
    userId: string,
    screeningRecordId: string,
  ): Promise<ScreeningSummary | null> {
    return this.onboarding.getScreeningSummaryByIdForUser(userId, screeningRecordId);
  }

  getLatestDietPreferenceSummary(userId: string): Promise<DietPreferenceSummary | null> {
    return this.onboarding.getLatestDietPreferenceSummary(userId);
  }

  getDietPreferenceSummaryByIdForUser(
    userId: string,
    dietPreferenceId: string,
  ): Promise<DietPreferenceSummary | null> {
    return this.onboarding.getDietPreferenceSummaryByIdForUser(userId, dietPreferenceId);
  }
}
