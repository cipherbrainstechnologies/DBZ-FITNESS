import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Redirect, Tabs } from 'expo-router';

import { LoadingBlock } from '@/src/components/ui';
import { useAuth } from '@/src/auth/AuthContext';
import { useI18n } from '@/src/i18n';
import { useOnboardingStatus } from '@/src/onboarding/useOnboardingStatus';
import { colors, fonts } from '@/src/theme';

function TabIcon(props: { name: React.ComponentProps<typeof FontAwesome>['name']; color: string }) {
  return <FontAwesome size={22} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabsLayout() {
  const { status } = useAuth();
  const { t } = useI18n();
  const onboarding = useOnboardingStatus();

  if (status === 'loading' || onboarding === 'loading') {
    return <LoadingBlock label={t('todayLoading')} />;
  }

  if (status !== 'authenticated') {
    return <Redirect href="/(auth)/login" />;
  }

  if (onboarding === 'incomplete') {
    return <Redirect href="/(onboarding)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.semibold },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.raised,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: t('tabToday'),
          tabBarIcon: ({ color }) => <TabIcon name="sun-o" color={color} />,
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: t('tabTrain'),
          tabBarIcon: ({ color }) => <TabIcon name="bolt" color={color} />,
        }}
      />
      <Tabs.Screen
        name="fuel"
        options={{
          title: t('tabFuel'),
          tabBarIcon: ({ color }) => <TabIcon name="cutlery" color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t('tabProgress'),
          tabBarIcon: ({ color }) => <TabIcon name="line-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabProfile'),
          tabBarIcon: ({ color }) => <TabIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
