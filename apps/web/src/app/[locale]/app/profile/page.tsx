'use client';

import type { CharacterSelection, CoachMemoryEntry } from '@saiyan/contracts';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { CharacterPortrait } from '@/components/character-portrait';
import { RequireAuth } from '@/components/require-auth';
import { RequireMemberJourney } from '@/components/require-member-journey';
import { SiteHeader } from '@/components/site-header';
import { Link, useRouter } from '@/i18n/navigation';
import { api, ApiClientError } from '@/lib/api';
import { mapApiError } from '@/lib/map-api-error';

function MyCoachPanel() {
  const t = useTranslations();
  const router = useRouter();
  const [selection, setSelection] = useState<CharacterSelection | null>(null);
  const [memory, setMemory] = useState<CoachMemoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [sel, mem] = await Promise.all([
        api.getCharacterSelection(),
        api.listCoachMemory().catch(() => ({ entries: [] as CoachMemoryEntry[] })),
      ]);
      setSelection(sel.selection);
      setMemory(mem.entries);
      setError(null);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        router.replace('/login');
        return;
      }
      setError(mapApiError(err, t).message);
    }
  }, [router, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function removeMemory(id: string) {
    await api.deleteCoachMemory(id);
    await load();
  }

  if (error) {
    return (
      <div className="form-status" data-tone="error" role="alert">
        {error}
      </div>
    );
  }

  if (!selection) {
    return (
      <section className="app-panel">
        <h1>{t('profile.coachTitle')}</h1>
        <p>{t('coach.supporting')}</p>
        <Link href="/app/coach" className="btn btn-primary">
          {t('profile.chooseCoach')}
        </Link>
      </section>
    );
  }

  const item = selection.presentation;

  return (
    <section className="app-panel" aria-labelledby="my-coach-title">
      <h1 id="my-coach-title">{t('profile.coachTitle')}</h1>
      <div className="today-character">
        <CharacterPortrait
          className="today-character__art"
          archetypeKey={item.archetypeKey}
          artworkUrl={item.artworkUrl}
          name={item.approvedName}
        />
        <div className="today-character__copy">
          <h2>{item.approvedName}</h2>
          <p>{item.coachingDescription}</p>
          <p className="note">{t('coach.samplePreview')}</p>
          <p>{item.sampleGreeting}</p>
          <Link href="/app/coach?change=1" className="btn btn-primary">
            {t('profile.changeCoach')}
          </Link>
        </div>
      </div>
      <p className="note">{t('profile.historyKept')}</p>
      <h2>{t('profile.memoryTitle')}</h2>
      {memory.length === 0 ? (
        <p className="note">{t('profile.memoryEmpty')}</p>
      ) : (
        <ul className="meta-list">
          {memory.map((entry) => (
            <li key={entry.id}>
              <strong>{entry.key}:</strong> {entry.valueText}{' '}
              <button type="button" className="btn btn-ghost" onClick={() => void removeMemory(entry.id)}>
                {t('profile.deleteMemory')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function ProfilePage() {
  const t = useTranslations();

  return (
    <div className="shell">
      <a className="skip-link" href="#main">
        {t('a11y.skipToContent')}
      </a>
      <SiteHeader variant="app" />
      <main id="main" className="main">
        <RequireAuth>
          <RequireMemberJourney allow={['TODAY']}>
            <MyCoachPanel />
          </RequireMemberJourney>
        </RequireAuth>
      </main>
    </div>
  );
}
