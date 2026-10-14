import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@tekom/i18n';
import styles from '@/components/public/public.module.css';
import { getSettings } from '@/content/settings';

type Props = { params: Promise<{ locale: string }> };

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'nav' });
    return { title: t('contact') };
}

export default async function ContactPage({ params }: Props) {
    const { locale } = (await params) as { locale: Locale };
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'contact' });
    const settings = getSettings(locale);
    const phones = [settings.phone, settings.phoneAlt].filter((phone): phone is string => phone !== null);

    return (
        <div className={`wrap ${styles.page}`}>
            <h1>{t('h')}</h1>
            <p className="lead">{t('p')}</p>
            <dl className={`facts ${styles.contact}`}>
                <dt>{t('phone')}</dt>
                <dd>
                    {phones.map((phone) => (
                        <a key={phone} href={telHref(phone)}>
                            {phone}
                        </a>
                    ))}
                </dd>
                <dt>{t('email')}</dt>
                <dd>
                    <a href={`mailto:${settings.email}`}>{settings.email}</a>
                </dd>
                <dt>{t('office')}</dt>
                <dd>{settings.address}</dd>
            </dl>
        </div>
    );
}
