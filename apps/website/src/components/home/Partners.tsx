import { getTranslations } from 'next-intl/server';
import type { HomeData } from '@/content/home';
import styles from './home.module.css';

export async function Partners({ locale, partners }: { locale: string; partners: HomeData['partners'] }) {
    if (partners.length === 0) return null;
    const t = await getTranslations({ locale, namespace: 'partners' });
    return (
        <div data-partners>
            <div className="sh">
                <h2>{t('h')}</h2>
            </div>
            <div className={styles.partners}>
                {partners.map((partner) => (
                    <div key={partner.name}>
                        <span>
                            {partner.url ? (
                                <a href={partner.url} rel="noopener noreferrer">
                                    {partner.name}
                                </a>
                            ) : (
                                partner.name
                            )}
                        </span>
                        <span>{partner.role}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
