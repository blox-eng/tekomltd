import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@tekom/i18n';
import styles from '@/components/public/public.module.css';
import { getSettings } from '@/content/settings';
import { pageMetadata } from '@/lib/seo';
import { siteShareImage } from '@/lib/share';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const [t, contact] = await Promise.all([getTranslations({ locale, namespace: 'nav' }), getTranslations({ locale, namespace: 'contact' })]);
    const { pageTitles, pageDescriptions } = getSettings(locale as Locale);
    return pageMetadata({
        locale: locale as Locale,
        path: '/contact',
        title: pageTitles.contact ?? t('contact'),
        description: pageDescriptions.contact ?? contact('p'),
        image: siteShareImage(locale as Locale)
    });
}

export default async function ContactPage({ params }: Props) {
    const { locale } = (await params) as { locale: Locale };
    setRequestLocale(locale);
    const t = await getTranslations({ locale, namespace: 'contact' });
    const settings = getSettings(locale);

    return (
        <div className={`wrap ${styles.page}`}>
            <h1>{t('h')}</h1>
            <p className="lead">{t('p')}</p>
            <dl className={`facts ${styles.contact}`}>
                <dt>{t('phone')}</dt>
                <dd>
                    <a href={settings.phoneHref}>{settings.phone}</a>
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
