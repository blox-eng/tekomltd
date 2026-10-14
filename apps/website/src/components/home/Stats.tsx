import type { Locale } from '@tekom/i18n';
import type { HomeData } from '@/content/home';
import { formatStat } from './format';
import styles from './home.module.css';

export function Stats({ locale, stats }: { locale: Locale; stats: HomeData['stats'] }) {
    if (stats.length === 0) return null;
    return (
        <div className={styles.nums}>
            {stats.map((stat) => (
                <div key={stat.label} data-stat>
                    <b>{formatStat(stat.value, locale, stat.unconfirmed)}</b>
                    <span>{stat.label}</span>
                </div>
            ))}
        </div>
    );
}
