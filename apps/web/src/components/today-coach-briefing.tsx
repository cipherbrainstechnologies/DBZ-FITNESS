'use client';

import type { CoachBriefingResponse, PostCoachMessageResponse } from '@saiyan/contracts';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { CharacterPortrait } from '@/components/character-portrait';
import { Link, useRouter } from '@/i18n/navigation';
import { api, ApiClientError } from '@/lib/api';
import { mapApiError } from '@/lib/map-api-error';

export function TodayCoachBriefing() {
  const t = useTranslations();
  const router = useRouter();
  const [briefing, setBriefing] = useState<CoachBriefingResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [chat, setChat] = useState('');
  const [chatPending, setChatPending] = useState(false);
  const [chatResult, setChatResult] = useState<PostCoachMessageResponse | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await api.getCoachBriefing();
      setBriefing(next);
      setLoadError(null);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        router.replace('/login');
        return;
      }
      setLoadError(mapApiError(err, t).message);
    }
  }, [router, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function runPrimaryAction() {
    if (!briefing?.action) return;
    setActionPending(true);
    setActionError(null);
    try {
      const action = briefing.action;
      const plannedSessionId =
        typeof action.payload.plannedSessionId === 'string'
          ? action.payload.plannedSessionId
          : null;
      if (action.actionType === 'START_WORKOUT' && plannedSessionId) {
        await api.startWorkoutSession({ plannedSessionId });
        router.push(`/app/train/session/${plannedSessionId}`);
        return;
      }
      if (
        (action.actionType === 'PREVIEW_SHORTER_SESSION' ||
          action.actionType === 'SELECT_SHORT_SESSION') &&
        plannedSessionId
      ) {
        await api.shortenPlannedSession(plannedSessionId, { targetDurationMinutes: 15 });
        router.push('/app/train');
        return;
      }
      if (action.actionType === 'LOG_CHECK_IN') {
        await api.upsertCoachMemory({
          key: 'check_in',
          valueText: 'Checked in from Today',
          sourceRef: 'today-briefing',
        });
        await load();
        return;
      }
      router.push(action.href);
    } catch (err) {
      setActionError(mapApiError(err, t).message);
    } finally {
      setActionPending(false);
    }
  }

  async function onChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!chat.trim() || chatPending) return;
    setChatPending(true);
    try {
      const result = await api.postCoachMessage({ message: chat.trim() });
      setChatResult(result);
      setChat('');
    } catch (err) {
      setActionError(mapApiError(err, t).message);
    } finally {
      setChatPending(false);
    }
  }

  if (loadError) {
    return (
      <aside className="today-character" aria-label={t('today.character.title')}>
        <p className="note">{loadError}</p>
      </aside>
    );
  }

  if (!briefing) {
    return (
      <aside className="today-character" aria-busy="true">
        <p className="note">{t('today.character.loading')}</p>
      </aside>
    );
  }

  const persona = briefing.persona;

  return (
    <aside className="today-character" aria-label={t('today.character.title')}>
      <CharacterPortrait
        className="today-character__art"
        archetypeKey={persona.archetypeKey}
        artworkUrl={persona.artworkUrl}
        name={persona.displayName}
      />
      <div className="today-character__copy">
        <p className="today-character__kicker">{t('today.character.title')}</p>
        <h2>{persona.displayName}</h2>
        <p>{briefing.messageText}</p>
        <div className="cta-row">
          {briefing.action ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={actionPending}
              onClick={() => void runPrimaryAction()}
            >
              {actionPending ? t('today.training.starting') : briefing.action.label}
            </button>
          ) : null}
          <Link href="/app/profile" className="btn btn-ghost">
            {t('today.character.myCoach')}
          </Link>
        </div>
        {actionError ? (
          <div className="form-status" data-tone="error" role="alert">
            {actionError}
          </div>
        ) : null}

        <form className="coach-chat" onSubmit={(event) => void onChat(event)}>
          <label htmlFor="coach-chat-input">{t('today.character.askCoach')}</label>
          <input
            id="coach-chat-input"
            value={chat}
            onChange={(event) => setChat(event.target.value)}
            disabled={chatPending}
            maxLength={4000}
          />
          <button type="submit" className="btn btn-ghost" disabled={chatPending || !chat.trim()}>
            {chatPending ? t('today.character.sending') : t('today.character.send')}
          </button>
        </form>
        {chatResult ? (
          <p className="note" role="status">
            {chatResult.response.messageText}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
