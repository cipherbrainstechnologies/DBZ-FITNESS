/**
 * Deterministic development / local fixtures.
 * Labelled as fixtures — never use in production seed paths without an explicit guard.
 */

import type { Role } from '@saiyan/contracts';

export type MemberFixture = {
  /** Stable fixture key for seeds and tests. */
  key: string;
  email: string;
  displayName: string;
  /** Plaintext password for local auth seeding only (hashed before persist). */
  passwordPlaintext: string;
  roles: Role[];
  locale: string;
  currentTimeZone: string;
  label: 'fixture';
};

export const FIXTURE_LABEL = 'fixture' as const;

/** Canonical member fixture used across local/dev and acceptance journeys. */
export const memberFixture: MemberFixture = {
  key: 'member-default',
  email: 'member@example.com',
  displayName: 'Fixture Member',
  passwordPlaintext: 'FixtureMember1!',
  roles: ['MEMBER'],
  locale: 'en',
  currentTimeZone: 'UTC',
  label: FIXTURE_LABEL,
};

export const adminFixture: MemberFixture = {
  key: 'admin-default',
  email: 'admin@example.com',
  displayName: 'Fixture Admin',
  passwordPlaintext: 'FixtureAdmin1!',
  roles: ['ADMIN', 'MEMBER'],
  locale: 'en',
  currentTimeZone: 'UTC',
  label: FIXTURE_LABEL,
};

export const supportFixture: MemberFixture = {
  key: 'support-default',
  email: 'support@example.com',
  displayName: 'Fixture Support',
  passwordPlaintext: 'FixtureSupport1!',
  roles: ['SUPPORT'],
  locale: 'en',
  currentTimeZone: 'UTC',
  label: FIXTURE_LABEL,
};

export const allMemberFixtures: readonly MemberFixture[] = [
  memberFixture,
  adminFixture,
  supportFixture,
];

export function getMemberFixtureByEmail(email: string): MemberFixture | undefined {
  const normalised = email.trim().toLowerCase();
  return allMemberFixtures.find((f) => f.email === normalised);
}
