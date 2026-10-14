import { getTranslations } from 'next-intl/server';
import type { ProjectCard } from '@/content/cards';
import { BulgariaMap } from './BulgariaMap';
import { CityMap } from './CityMap';
import { mapPins } from './geo';
import { MapTip } from './MapTip';
import styles from './map.module.css';

export async function MapSection({ locale, cards }: { locale: string; cards: ProjectCard[] }) {
    const t = await getTranslations({ locale, namespace: 'map' });
    const { country, city, cityCount } = mapPins(cards);

    return (
        <section className={styles.section} data-map>
            <div className="sh">
                <h2>{t('h')}</h2>
                <p>{t('p')}</p>
            </div>
            <MapTip>
                <div className={styles.card}>
                    <span className="micro">{t('bg')}</span>
                    <BulgariaMap label={t('bg')} pins={country} cityCount={cityCount} cyrillic={locale === 'bg'} />
                </div>
                <div className={styles.card}>
                    <span className="micro">{t('sz')}</span>
                    <CityMap label={t('sz')} pins={city} />
                </div>
            </MapTip>
        </section>
    );
}
