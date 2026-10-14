import { getTranslations } from 'next-intl/server';
import type { Locale } from '@tekom/i18n';
import { getSettings } from '@/content/settings';
import { Link } from '@/i18n/navigation';

const SOCIAL_ICONS = {
    linkedin:
        'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3V9.5Zm7 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.1c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7V21h-4V9.5Z',
    instagram:
        'M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm4.9-8.9a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 3.6c2.7 0 3 0 4.1.1 2.8.1 4.1 1.4 4.2 4.2.1 1.1.1 1.4.1 4.1s0 3-.1 4.1c-.1 2.8-1.4 4.1-4.2 4.2-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-2.8-.1-4.1-1.4-4.2-4.2C3.6 15 3.6 14.7 3.6 12s0-3 .1-4.1C3.8 5.1 5.1 3.8 7.9 3.7c1.1-.1 1.4-.1 4.1-.1Z',
    facebook: 'M13.5 21v-7.5H16l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9Z'
} as const;

const SOCIAL_LABELS = { linkedin: 'LinkedIn', instagram: 'Instagram', facebook: 'Facebook' } as const;

export async function Footer({ locale }: { locale: Locale }) {
    const [t, tn] = await Promise.all([getTranslations({ locale, namespace: 'footer' }), getTranslations({ locale, namespace: 'nav' })]);
    const settings = getSettings(locale);
    const registration = [settings.eik && `EIK ${settings.eik}`, settings.vat && `VAT ${settings.vat}`].filter(Boolean).join(' / ');
    const socials = (Object.keys(SOCIAL_ICONS) as (keyof typeof SOCIAL_ICONS)[]).flatMap((key) => {
        const url = settings.socials[key];
        return url ? [{ key, url }] : [];
    });

    return (
        <footer className="site-footer">
            <div className="wrap">
                <div className="fcols">
                    <div>
                        <h2>{t('company')}</h2>
                        <ul>
                            <li>{settings.legalName}</li>
                            {registration && <li>{registration}</li>}
                            <li>{settings.address}</li>
                            <li className="mono">
                                <a href={`tel:${settings.phone.replace(/\s/g, '')}`}>{settings.phone}</a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h2>{t('work')}</h2>
                        <ul>
                            <li>
                                <Link href="/projects">{tn('projects')}</Link>
                            </li>
                            <li>
                                <Link href="/#services">{t('services')}</Link>
                            </li>
                            <li>
                                <Link href="/contact">{tn('contact')}</Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h2>{t('public')}</h2>
                        <ul>
                            <li>
                                <Link href="/eu-programmes">{tn('eu')}</Link>
                            </li>
                            <li>
                                <Link href="/publications">{t('pubs')}</Link>
                            </li>
                            <li>
                                <Link href="/publications">{t('procure')}</Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h2>{t('privacy')}</h2>
                        <ul>
                            <li>
                                <Link href="/privacy">{t('policy')}</Link>
                            </li>
                            <li>
                                <Link href="/cookies">{t('cookies')}</Link>
                            </li>
                            <li>
                                <Link href="/data-rights">{t('rights')}</Link>
                            </li>
                            <li>
                                <Link href="/terms">{t('terms')}</Link>
                            </li>
                        </ul>
                    </div>
                    {socials.length > 0 && (
                        <div>
                            <h2>{t('follow')}</h2>
                            <div className="social">
                                {socials.map(({ key, url }) => (
                                    <a key={key} href={url} aria-label={SOCIAL_LABELS[key]} target="_blank" rel="noopener">
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path d={SOCIAL_ICONS[key]} />
                                        </svg>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="eu-line">
                    <span className="eubadge">EU · ESF+</span>
                    <span className="eubadge">EU · ERDF</span>
                    <Link href="/eu-programmes">{t('eu')}</Link>
                </div>
                <div className="legal-line">
                    <span>
                        © {new Date().getFullYear()} {settings.legalName}
                    </span>
                    <span>{t('made')}</span>
                </div>
            </div>
        </footer>
    );
}
