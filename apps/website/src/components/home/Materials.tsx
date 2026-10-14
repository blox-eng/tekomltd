import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import type { HomeData } from '@/content/home';
import styles from './home.module.css';

export async function Materials({ locale, brands }: { locale: string; brands: HomeData['brands'] }) {
    if (brands.length === 0) return null;
    const t = await getTranslations({ locale, namespace: 'materials' });
    return (
        <div data-materials>
            <div className="sh">
                <h2>{t('h')}</h2>
                <p>{t('p')}</p>
            </div>
            <ul className={styles.brands}>
                {brands.map((brand) => {
                    const logo = <Image src={brand.logo.src} alt={brand.name} title={brand.name} width={brand.logo.width} height={brand.logo.height} />;
                    return (
                        <li key={brand.name}>
                            {brand.url ? (
                                <a href={brand.url} rel="noopener noreferrer">
                                    {logo}
                                </a>
                            ) : (
                                logo
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
