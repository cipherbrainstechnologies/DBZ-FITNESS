/**
 * Media publication eligibility — rights-aware delivery checks (docs/06).
 * Pure helpers: no Prisma / UI / provider SDKs.
 */

export type PublicationStatusValue =
  | 'DRAFT'
  | 'UNAVAILABLE'
  | 'PUBLISHED'
  | 'WITHDRAWN';

export type ContentReviewStatusValue =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export type QuoteKindValue =
  | 'ORIGINAL_COPY'
  | 'VERIFIED_LICENSED_QUOTE'
  | 'LICENSED_AUDIO_DIALOGUE';

export type RightsGrantSnapshot = {
  id: string;
  permittedUses: string[];
  platforms?: string[] | null;
  territories?: string[] | null;
  validFrom: Date;
  validUntil: Date | null;
};

export type PublicationEligibilityInput = {
  publicationStatus: PublicationStatusValue;
  reviewStatus: ContentReviewStatusValue;
  withdrawnAt?: Date | null;
  /** Active ContentPublication expiresAt when present. */
  publicationExpiresAt?: Date | null;
  scheduledPublishAt?: Date | null;
  rightsGrantIds?: string[] | null;
  grants?: RightsGrantSnapshot[];
  /** Required use code for this delivery (e.g. IN_APP_DISPLAY). */
  requiredUse: string;
  platform?: string;
  territory?: string;
  now?: Date;
};

export type PublicationEligibilityResult = {
  eligible: boolean;
  reasons: string[];
};

export type ExpiryWithdrawalCheckInput = {
  publicationStatus: PublicationStatusValue;
  withdrawnAt?: Date | null;
  expiresAt?: Date | null;
  grantValidUntil?: Date | null;
  now?: Date;
};

export type ExpiryWithdrawalCheckResult = {
  withdrawn: boolean;
  expired: boolean;
  grantExpired: boolean;
  deliverable: boolean;
  reasons: string[];
};

/**
 * Asset/quote is deliverable only when review approved, published,
 * not withdrawn, not expired, and applicable grants cover the use.
 */
export function evaluatePublicationEligibility(
  input: PublicationEligibilityInput,
): PublicationEligibilityResult {
  const now = input.now ?? new Date();
  const reasons: string[] = [];

  if (input.publicationStatus !== 'PUBLISHED') {
    reasons.push('PUBLICATION_STATUS_NOT_PUBLISHED');
  }
  if (input.reviewStatus !== 'APPROVED') {
    reasons.push('REVIEW_NOT_APPROVED');
  }
  if (input.withdrawnAt != null) {
    reasons.push('WITHDRAWN');
  }
  if (
    input.scheduledPublishAt != null &&
    input.scheduledPublishAt.getTime() > now.getTime()
  ) {
    reasons.push('SCHEDULED_IN_FUTURE');
  }
  if (
    input.publicationExpiresAt != null &&
    input.publicationExpiresAt.getTime() <= now.getTime()
  ) {
    reasons.push('PUBLICATION_EXPIRED');
  }

  const grantIds = Array.isArray(input.rightsGrantIds)
    ? input.rightsGrantIds.filter((id): id is string => typeof id === 'string')
    : [];

  // ORIGINAL fixtures may ship without grants when uses are product-owned.
  // Licensed kinds must attach at least one covering grant.
  if (grantIds.length > 0) {
    const grants = input.grants ?? [];
    const byId = new Map(grants.map((g) => [g.id, g]));
    let anyCovering = false;
    for (const id of grantIds) {
      const grant = byId.get(id);
      if (!grant) {
        reasons.push('MISSING_GRANT_RECORD');
        continue;
      }
      if (!isGrantValidAt(grant, now)) {
        reasons.push('GRANT_EXPIRED_OR_NOT_YET_VALID');
        continue;
      }
      if (!grant.permittedUses.includes(input.requiredUse)) {
        reasons.push('GRANT_USE_NOT_PERMITTED');
        continue;
      }
      if (
        input.platform &&
        Array.isArray(grant.platforms) &&
        grant.platforms.length > 0 &&
        !grant.platforms.includes(input.platform)
      ) {
        reasons.push('GRANT_PLATFORM_NOT_COVERED');
        continue;
      }
      if (
        input.territory &&
        Array.isArray(grant.territories) &&
        grant.territories.length > 0 &&
        !grant.territories.includes(input.territory)
      ) {
        reasons.push('GRANT_TERRITORY_NOT_COVERED');
        continue;
      }
      anyCovering = true;
    }
    if (!anyCovering) {
      reasons.push('NO_COVERING_GRANT');
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

export function isGrantValidAt(grant: RightsGrantSnapshot, at: Date): boolean {
  if (grant.validFrom.getTime() > at.getTime()) {
    return false;
  }
  if (grant.validUntil != null && grant.validUntil.getTime() <= at.getTime()) {
    return false;
  }
  return true;
}

/**
 * Expiry / withdrawal checks used when issuing delivery URLs and on worker jobs.
 */
export function checkExpiryAndWithdrawal(
  input: ExpiryWithdrawalCheckInput,
): ExpiryWithdrawalCheckResult {
  const now = input.now ?? new Date();
  const reasons: string[] = [];
  const withdrawn =
    input.publicationStatus === 'WITHDRAWN' || input.withdrawnAt != null;
  const expired =
    input.expiresAt != null && input.expiresAt.getTime() <= now.getTime();
  const grantExpired =
    input.grantValidUntil != null &&
    input.grantValidUntil.getTime() <= now.getTime();

  if (withdrawn) reasons.push('WITHDRAWN');
  if (expired) reasons.push('EXPIRED');
  if (grantExpired) reasons.push('GRANT_EXPIRED');
  if (input.publicationStatus !== 'PUBLISHED' && !withdrawn) {
    reasons.push('NOT_PUBLISHED');
  }

  return {
    withdrawn,
    expired,
    grantExpired,
    deliverable: reasons.length === 0,
    reasons,
  };
}

/**
 * ORIGINAL motivational copy attribution — never present as authentic DBZ dialogue.
 */
export const ORIGINAL_COPY_ATTRIBUTION = 'Saiyan Ascend original copy' as const;

export function isAuthenticLicensedQuoteKind(kind: QuoteKindValue): boolean {
  return (
    kind === 'VERIFIED_LICENSED_QUOTE' || kind === 'LICENSED_AUDIO_DIALOGUE'
  );
}

/**
 * Member-facing content today must only surface ORIGINAL_COPY unless rights verified.
 */
export function isSafeForOriginalContentMode(kind: QuoteKindValue): boolean {
  return kind === 'ORIGINAL_COPY';
}
