import { redirect } from '@/i18n/navigation';

/** Alias for the member shell — same destination as /app. */
export default async function TodayAliasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: '/app', locale });
}
