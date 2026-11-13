import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@tekom/i18n';
import type { Totals as TotalsView } from '@/content/sales';
import { formatDate } from '@/components/projects/Progress';
import { area } from './words';
import styles from './sales.module.css';

const ORDER = ['free', 'upcoming', 'reserved', 'sold'] as const;

/** "8 обекта · 3 свободни · 1 предстои …", counted from the units, never typed. */
export function Totals({ totals, updated }: { totals: TotalsView; updated: string }) {
    const t = useTranslations('sales');
    const locale = useLocale() as Locale;
    const parts = [t('units', { n: totals.units }), ...ORDER.filter((s) => totals.byStatus[s] > 0).map((s) => t(`count.${s}`, { n: totals.byStatus[s] }))];
    const free = totals.freeArea;
    return (
        <div className={styles.totals} data-totals>
            <p className={styles.count}>{parts.join(' · ')}</p>
            {free && (
                <p>
                    {free.min === free.max
                        ? t('freeAreaOne', { min: area(free.min, locale) })
                        : t('freeArea', { min: area(free.min, locale), max: area(free.max, locale) })}
                </p>
            )}
            <p className={`mono ${styles.asOf}`}>{t('asOf', { date: formatDate(updated) })}</p>
        </div>
    );
}
