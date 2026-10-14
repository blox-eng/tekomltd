import { getTranslations } from 'next-intl/server';
import { TurningWord } from '@tekom/ui';
import { splitTurn } from '@tekom/ui/turn';
import type { Locale } from '@tekom/i18n';
import type { HomeData } from '@/content/home';
import { CrewSplit } from './CrewSplit';
import styles from './crews.module.css';

type Props = { locale: Locale; crews: HomeData['crews']; headline: string[] };

export async function Crews({ locale, crews, headline }: Props) {
    if (crews.length === 0) return null;
    const t = await getTranslations({ locale, namespace: 'crew' });
    const { start, turns } = splitTurn(headline);
    return (
        <section className={styles.crews} data-crews>
            <div className="sh">
                <h2>
                    <TurningWord key={locale} start={start} turns={turns} />
                </h2>
                <p>{t('p')}</p>
            </div>
            {crews.map((crew, i) => (
                <CrewSplit key={crew.key} crew={crew} flip={i % 2 === 1} yearsLabel={t('y')} stampLabel={t('photoPending')} />
            ))}
        </section>
    );
}
