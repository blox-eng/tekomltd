import { getTranslations } from 'next-intl/server';
import { Glyph, type GlyphKey } from '@tekom/ui';
import type { HomeData } from '@/content/home';
import { PartnerTrack } from './PartnerTrack';
import styles from './home.module.css';

type Props = { locale: string; services: HomeData['partnerServices']; prevLabel: string; nextLabel: string };

export async function PartnerServices({ locale, services, prevLabel, nextLabel }: Props) {
    if (services.length === 0) return null;
    const t = await getTranslations({ locale, namespace: 'partnerServices' });
    return (
        <section id="services" className={styles.psec}>
            <div className="sh">
                <h2>{t('h')}</h2>
                <p>{t('p')}</p>
            </div>
            <PartnerTrack label={`${t('k')} · ${services.length}`} prevLabel={prevLabel} nextLabel={nextLabel}>
                {services.map((service) => (
                    <div key={service.title} className={styles.pcard}>
                        <Glyph name={service.icon as GlyphKey} />
                        <h3>{service.title}</h3>
                        <p>{service.body}</p>
                    </div>
                ))}
            </PartnerTrack>
        </section>
    );
}
