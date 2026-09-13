import { ComingLater } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';

export default function FuelScreen() {
  const { t } = useI18n();
  return <ComingLater title={t('comingLater')} detail={t('comingLaterDetail')} />;
}
