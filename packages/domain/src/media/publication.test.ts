import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ORIGINAL_COPY_ATTRIBUTION,
  checkExpiryAndWithdrawal,
  evaluatePublicationEligibility,
  isAuthenticLicensedQuoteKind,
  isGrantValidAt,
  isSafeForOriginalContentMode,
} from './publication.ts';

describe('evaluatePublicationEligibility', () => {
  const base = {
    publicationStatus: 'PUBLISHED' as const,
    reviewStatus: 'APPROVED' as const,
    requiredUse: 'IN_APP_DISPLAY',
  };

  it('allows published approved ORIGINAL content without grants', () => {
    const result = evaluatePublicationEligibility(base);
    assert.equal(result.eligible, true);
    assert.deepEqual(result.reasons, []);
  });

  it('rejects draft / unapproved / withdrawn content', () => {
    assert.equal(
      evaluatePublicationEligibility({
        ...base,
        publicationStatus: 'DRAFT',
      }).eligible,
      false,
    );
    assert.equal(
      evaluatePublicationEligibility({
        ...base,
        reviewStatus: 'IN_REVIEW',
      }).eligible,
      false,
    );
    assert.equal(
      evaluatePublicationEligibility({
        ...base,
        withdrawnAt: new Date('2026-01-01T00:00:00Z'),
      }).eligible,
      false,
    );
  });

  it('rejects when publication expiry has passed', () => {
    const result = evaluatePublicationEligibility({
      ...base,
      publicationExpiresAt: new Date('2020-01-01T00:00:00Z'),
      now: new Date('2026-09-13T12:00:00Z'),
    });
    assert.equal(result.eligible, false);
    assert.ok(result.reasons.includes('PUBLICATION_EXPIRED'));
  });

  it('requires a covering grant when rightsGrantIds are attached', () => {
    const grant = {
      id: 'grant-1',
      permittedUses: ['IN_APP_DISPLAY'],
      platforms: ['WEB'],
      territories: ['IN'],
      validFrom: new Date('2020-01-01T00:00:00Z'),
      validUntil: new Date('2030-01-01T00:00:00Z'),
    };
    const missing = evaluatePublicationEligibility({
      ...base,
      rightsGrantIds: ['grant-1'],
      grants: [],
      platform: 'WEB',
      territory: 'IN',
    });
    assert.equal(missing.eligible, false);

    const ok = evaluatePublicationEligibility({
      ...base,
      rightsGrantIds: ['grant-1'],
      grants: [grant],
      platform: 'WEB',
      territory: 'IN',
    });
    assert.equal(ok.eligible, true);

    const wrongUse = evaluatePublicationEligibility({
      ...base,
      rightsGrantIds: ['grant-1'],
      grants: [{ ...grant, permittedUses: ['OFFLINE_CACHE'] }],
      platform: 'WEB',
      territory: 'IN',
    });
    assert.equal(wrongUse.eligible, false);
  });
});

describe('checkExpiryAndWithdrawal', () => {
  it('marks withdrawn and expired content non-deliverable', () => {
    const result = checkExpiryAndWithdrawal({
      publicationStatus: 'WITHDRAWN',
      withdrawnAt: new Date('2026-01-01T00:00:00Z'),
      expiresAt: new Date('2026-01-02T00:00:00Z'),
      now: new Date('2026-09-13T12:00:00Z'),
    });
    assert.equal(result.withdrawn, true);
    assert.equal(result.expired, true);
    assert.equal(result.deliverable, false);
  });

  it('detects grant expiry independently', () => {
    const result = checkExpiryAndWithdrawal({
      publicationStatus: 'PUBLISHED',
      grantValidUntil: new Date('2025-01-01T00:00:00Z'),
      now: new Date('2026-09-13T12:00:00Z'),
    });
    assert.equal(result.grantExpired, true);
    assert.equal(result.deliverable, false);
  });
});

describe('isGrantValidAt', () => {
  it('rejects before validFrom and after validUntil', () => {
    const grant = {
      id: 'g',
      permittedUses: ['IN_APP_DISPLAY'],
      validFrom: new Date('2024-01-01T00:00:00Z'),
      validUntil: new Date('2025-01-01T00:00:00Z'),
    };
    assert.equal(isGrantValidAt(grant, new Date('2023-12-31T00:00:00Z')), false);
    assert.equal(isGrantValidAt(grant, new Date('2024-06-01T00:00:00Z')), true);
    assert.equal(isGrantValidAt(grant, new Date('2025-01-01T00:00:00Z')), false);
  });
});

describe('quote kind safety', () => {
  it('keeps ORIGINAL_COPY attribution honest', () => {
    assert.equal(ORIGINAL_COPY_ATTRIBUTION.includes('original'), true);
    assert.equal(isSafeForOriginalContentMode('ORIGINAL_COPY'), true);
    assert.equal(isSafeForOriginalContentMode('VERIFIED_LICENSED_QUOTE'), false);
    assert.equal(isAuthenticLicensedQuoteKind('LICENSED_AUDIO_DIALOGUE'), true);
  });
});
