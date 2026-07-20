import { useEffect } from 'react';
import { useOnboarding } from '@/features/onboarding/store';
import { useFinance } from '@/features/finance';
import { useCards } from '@/features/cards';
import { useAssets } from '@/features/assets';
import { collectReminderSources } from './sources';
import { useNotifications } from './store';

/**
 * Veri store’larından kaynak toplayıp bildirim planını yeniler.
 * UI ekranı değil; layout’ta mount edilir.
 */
export function NotificationResyncBridge() {
  const { data } = useOnboarding();
  const { activeExpenses } = useFinance();
  const { statements, payments } = useCards();
  const { assets, obligations } = useAssets();
  const { hydrating, resyncFromSources } = useNotifications();

  useEffect(() => {
    if (hydrating) return;
    const sources = collectReminderSources({
      cards: data.cards,
      statements,
      payments,
      transactions: activeExpenses,
      assets,
      obligations,
    });
    resyncFromSources(sources);
  }, [
    hydrating,
    data.cards,
    statements,
    payments,
    activeExpenses,
    assets,
    obligations,
    resyncFromSources,
  ]);

  return null;
}
