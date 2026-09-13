'use client';

import type { CharacterSelection } from '@saiyan/contracts';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { CharacterPortrait } from '@/components/character-portrait';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export function TodayCharacterBanner() {
  const t = useTranslations();
  const { user } = useAuth();
  const [selection, setSelection] = useState<CharacterSelection | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const result = await api.getCharacterSelection();
      setSelection(result.selection);
    } catch {
      setSelection(null);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!selection) return null;

  const item = selection.presentation;

  return (
    <aside className="today-character" aria-label={t('today.character.title')}>
      <CharacterPortrait
        className="today-character__art"
        archetypeKey={item.archetypeKey}
        artworkUrl={item.artworkUrl}
        name={item.approvedName}
      />
      <div className="today-character__copy">
        <p className="today-character__kicker">{t('today.character.title')}</p>
        <h2>{item.approvedName}</h2>
        {item.inspiredByLabel ? (
          <p className="character-inspired">
            {t('onboarding.character.inspiredBy', { name: item.inspiredByLabel })}
          </p>
        ) : null}
        <p className="note">{item.emphasis}</p>
        <p className="character-pack">{t('onboarding.character.originalArt')}</p>
      </div>
    </aside>
  );
}
