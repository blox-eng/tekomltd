import type { HomeData } from '@/content/home';
import { Materials } from './Materials';
import { Partners } from './Partners';
import styles from './home.module.css';

export function Trust({ locale, brands, partners }: { locale: string; brands: HomeData['brands']; partners: HomeData['partners'] }) {
    if (brands.length === 0 && partners.length === 0) return null;
    return (
        <section className={styles.trust}>
            <Materials locale={locale} brands={brands} />
            <Partners locale={locale} partners={partners} />
        </section>
    );
}
