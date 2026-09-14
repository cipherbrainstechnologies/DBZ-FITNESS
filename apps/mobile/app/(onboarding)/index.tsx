import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  completeOnboarding,
  getOnboarding,
  listCharacters,
  saveOnboardingStep,
  type CharacterPresentation,
  type OnboardingProgress,
} from '@/src/api/client';
import { useAuth } from '@/src/auth/AuthContext';
import { FeedbackBanner, Field, LoadingBlock, PrimaryButton, Screen } from '@/src/components/ui';
import { localCharacterArt } from '@/src/characters/art';
import { useI18n } from '@/src/i18n';
import { colors, fonts, spacing } from '@/src/theme';

const STEPS = [
  'WELCOME',
  'CHARACTER',
  'GOALS',
  'EXPERIENCE',
  'AVAILABILITY',
  'SCREENING',
  'DIET',
  'CONFIRM',
] as const;

type Step = (typeof STEPS)[number];

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function drainOptionalSteps(progress: OnboardingProgress): Promise<OnboardingProgress> {
  let next = progress;
  const optional: Array<{ step: string; payload: Record<string, unknown> }> = [
    {
      step: 'MEASUREMENTS',
      payload: { skip: true, nutritionCalculationPreference: 'SKIP' },
    },
    {
      step: 'NOTIFICATIONS',
      payload: { enablePush: false, enableEmail: false },
    },
    {
      step: 'PLAN_PREVIEW',
      payload: { acknowledgedExplanation: true },
    },
  ];
  for (const item of optional) {
    if (!next.completedSteps.includes(item.step) && next.currentStep === item.step) {
      const saved = await saveOnboardingStep({ step: item.step, payload: item.payload });
      next = saved.progress;
    }
  }
  return next;
}

export default function OnboardingScreen() {
  const { status } = useAuth();
  const { t } = useI18n();
  const [boot, setBoot] = useState<'loading' | 'ready' | 'done'>('loading');
  const [step, setStep] = useState<Step>('WELCOME');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dateOfBirth, setDateOfBirth] = useState('1995-01-15');
  const [consented, setConsented] = useState(false);
  const [goal, setGoal] = useState('consistency');
  const [presentationId, setPresentationId] = useState<string | null>(null);
  const [characters, setCharacters] = useState<CharacterPresentation[]>([]);

  const bootOnboarding = useCallback(async () => {
    try {
      const { progress, journey } = await getOnboarding();
      if (progress.completedAt || journey?.destination === 'TODAY') {
        setBoot('done');
        return;
      }
      const current = STEPS.includes(progress.currentStep as Step)
        ? (progress.currentStep as Step)
        : 'WELCOME';
      setStep(current);
      setBoot('ready');
    } catch {
      setError(t('unknownError'));
      setBoot('ready');
    }
  }, [t]);

  useEffect(() => {
    if (status === 'authenticated') {
      void bootOnboarding();
    }
  }, [bootOnboarding, status]);

  useEffect(() => {
    if (step !== 'CHARACTER') return;
    void listCharacters()
      .then((result) => {
        setCharacters(result.presentations);
        if (result.unavailable || result.presentations.length === 0) {
          setError(t('unknownError'));
        }
      })
      .catch(() => setError(t('unknownError')));
  }, [step, t]);

  if (status === 'loading' || boot === 'loading') {
    return <LoadingBlock label={t('onboardingLoading')} />;
  }
  if (status !== 'authenticated') {
    return <Redirect href="/(auth)/login" />;
  }
  if (boot === 'done') {
    return <Redirect href="/(tabs)/today" />;
  }

  async function persistAndAdvance(body: unknown, complete = false) {
    setPending(true);
    setError(null);
    try {
      let { progress } = await saveOnboardingStep(body);
      progress = await drainOptionalSteps(progress);
      if (complete) {
        await completeOnboarding();
        router.replace('/(tabs)/today');
        return;
      }
      const next = STEPS.find((item) => !progress.completedSteps.includes(item));
      setStep(next ?? 'CONFIRM');
    } catch {
      setError(t('unknownError'));
    } finally {
      setPending(false);
    }
  }

  async function onContinue() {
    switch (step) {
      case 'WELCOME':
        if (!consented || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
          setError(t('validationOnboarding'));
          return;
        }
        await persistAndAdvance({
          step: 'WELCOME',
          payload: {
            dateOfBirth,
            asOfDate: todayIsoDate(),
            consents: [
              { purpose: 'TERMS_OF_SERVICE', policyVersion: 'tos-v1', granted: true },
              { purpose: 'PRIVACY_POLICY', policyVersion: 'privacy-v1', granted: true },
              {
                purpose: 'HEALTH_DATA_PROCESSING',
                policyVersion: 'health-data-v1',
                granted: true,
              },
            ],
          },
        });
        return;
      case 'GOALS':
        await persistAndAdvance({
          step: 'GOALS',
          payload: { goals: [goal] },
        });
        return;
      case 'EXPERIENCE':
        await persistAndAdvance({
          step: 'EXPERIENCE',
          payload: { experience: 'BEGINNER' },
        });
        return;
      case 'AVAILABILITY':
        await persistAndAdvance({
          step: 'AVAILABILITY',
          payload: {
            weeklyAvailabilityMinutes: 150,
            availableDays: ['MON', 'WED', 'FRI'],
            sessionDurationMinutes: 45,
            equipment: ['none'],
          },
        });
        return;
      case 'SCREENING':
        await persistAndAdvance({
          step: 'SCREENING',
          payload: { questionnaireVersion: 'screening-v1' },
        });
        return;
      case 'DIET':
        await persistAndAdvance({
          step: 'DIET',
          payload: { pattern: 'NON_VEGETARIAN' },
        });
        return;
      case 'CHARACTER':
        if (!presentationId) {
          setError(t('validationOnboarding'));
          return;
        }
        await persistAndAdvance({
          step: 'CHARACTER',
          payload: { presentationId },
        });
        return;
      case 'CONFIRM':
        await persistAndAdvance({ step: 'CONFIRM', payload: { confirm: true } }, true);
        return;
    }
  }

  return (
    <Screen style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>{t('onboardingKicker')}</Text>
        <Text style={styles.title}>{t('onboardingTitle')}</Text>
        <Text style={styles.stepLabel}>
          {step} · {STEPS.indexOf(step) + 1}/{STEPS.length}
        </Text>
        <FeedbackBanner error={error} />

        {step === 'WELCOME' ? (
          <View style={styles.block}>
            <Text style={styles.body}>{t('onboardingWelcome')}</Text>
            <Field
              label={t('dateOfBirth')}
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="YYYY-MM-DD"
            />
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: consented }}
              onPress={() => setConsented((value) => !value)}
              style={styles.checkRow}
            >
              <View style={[styles.box, consented ? styles.boxOn : null]} />
              <Text style={styles.body}>{t('onboardingConsent')}</Text>
            </Pressable>
          </View>
        ) : null}

        {step === 'GOALS' ? (
          <View style={styles.block}>
            <Text style={styles.body}>{t('onboardingGoals')}</Text>
            {(['strength', 'conditioning', 'consistency'] as const).map((item) => (
              <Pressable
                key={item}
                onPress={() => setGoal(item)}
                style={[styles.choice, goal === item ? styles.choiceOn : null]}
              >
                <Text style={styles.choiceText}>{item}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {step === 'EXPERIENCE' ? <Text style={styles.body}>{t('onboardingExperience')}</Text> : null}
        {step === 'AVAILABILITY' ? <Text style={styles.body}>{t('onboardingAvailability')}</Text> : null}
        {step === 'SCREENING' ? <Text style={styles.body}>{t('onboardingScreening')}</Text> : null}
        {step === 'DIET' ? <Text style={styles.body}>{t('onboardingDiet')}</Text> : null}

        {step === 'CHARACTER' ? (
          <View style={styles.block}>
            <Text style={styles.body}>{t('onboardingCharacter')}</Text>
            <Text style={styles.note}>{t('originalArtNote')}</Text>
            {characters.map((item) => {
              const selected = presentationId === item.id;
              const local = localCharacterArt(item.archetypeKey);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setPresentationId(item.id)}
                  style={[styles.characterCard, selected ? styles.choiceOn : null]}
                >
                  {local ? (
                    <Image source={local} style={styles.portrait} accessibilityLabel={item.approvedName} />
                  ) : null}
                  <View style={styles.characterCopy}>
                    <Text style={styles.choiceText}>{item.approvedName}</Text>
                    {item.coachingDescription ? (
                      <Text style={styles.note}>{item.coachingDescription}</Text>
                    ) : (
                      <Text style={styles.note}>{item.emphasis}</Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {step === 'CONFIRM' ? <Text style={styles.body}>{t('onboardingConfirm')}</Text> : null}

        <PrimaryButton
          label={pending ? t('onboardingSaving') : t('onboardingContinue')}
          onPress={() => {
            void onContinue();
          }}
          loading={pending}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 48, gap: spacing.md },
  kicker: {
    fontFamily: fonts.medium,
    color: colors.secondary,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text,
  },
  stepLabel: {
    fontFamily: fonts.medium,
    color: colors.muted,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  note: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
  },
  inspired: {
    fontFamily: fonts.medium,
    color: colors.primary,
    fontSize: 13,
  },
  block: { gap: spacing.sm },
  checkRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  box: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.muted,
    marginTop: 2,
  },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  choice: {
    borderWidth: 1,
    borderColor: colors.raised,
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  choiceOn: { borderColor: colors.primary },
  choiceText: { fontFamily: fonts.semibold, color: colors.text, fontSize: 16 },
  characterCard: {
    flexDirection: 'row',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.raised,
    borderRadius: 14,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  portrait: { width: 72, height: 96, borderRadius: 8 },
  characterCopy: { flex: 1, gap: 4 },
});
