import { getTranslations } from 'next-intl/server';
import { Button, TekomMark } from '@tekom/ui';
import type { Locale } from '@tekom/i18n';
import { listServices } from '@/content/services';
import { getSettings } from '@/content/settings';
import { localePath } from '@/i18n/routing';
import { brandName } from '@/lib/seo';
import { Link } from '@/i18n/navigation';
import { LangSwitch } from './LangSwitch';
import { NavLinks } from './NavLinks';
import { ThemeToggle } from './ThemeToggle';

export async function Header({ locale }: { locale: Locale }) {
    const t = await getTranslations({ locale, namespace: 'nav' });
    const { quoteCta } = getSettings(locale);
    const services = listServices(locale);

    return (
        <header className="site-header">
            <div className="wrap">
                <Link href="/" className="logo" aria-label={t('home')}>
                    <TekomMark className="logo-mark" />
                    <span className="logo-word">{brandName(locale).toUpperCase()}</span>
                </Link>
                {/* A locale without its own service pages links to the services on the home page instead. */}
                <NavLinks
                    items={[
                        { href: '/projects', label: t('projects') },
                        ...(services.length === 0 ? [{ href: '/#services', label: t('services') }] : []),
                        { href: '/contact', label: t('contact') }
                    ]}
                    menuAfter={1}
                    menu={
                        services.length > 0
                            ? {
                                  label: t('services'),
                                  menuLabel: t('servicesMenu'),
                                  items: services.map(({ slug, name, blurb }) => ({ href: `/${slug}`, label: name, blurb }))
                              }
                            : undefined
                    }
                />
                <div className="tools">
                    <Link href="/eu-programmes" className="eu-mark" aria-label={t('eu')} title={t('eu')}>
                        <EuStars />
                        <span aria-hidden="true">{t('euShort')}</span>
                    </Link>
                    <LangSwitch />
                    {quoteCta && (
                        <Button variant="primary" href={localePath('/contact', locale)} className="hdr-cta">
                            {t('cta')}
                        </Button>
                    )}
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}

/** The twelve stars of the EU emblem as a line glyph: the funding is acknowledged without a second colour in the header. */
function EuStars() {
    const star = (cx: number, cy: number) =>
        Array.from({ length: 5 }, (_, i) => {
            const a = (Math.PI / 5) * 2 * i - Math.PI / 2;
            return `${(cx + 2 * Math.cos(a)).toFixed(2)},${(cy + 2 * Math.sin(a)).toFixed(2)}`;
        });
    const points = (cx: number, cy: number) => {
        const p = star(cx, cy);
        return [p[0], p[2], p[4], p[1], p[3]].join(' ');
    };
    return (
        <svg viewBox="0 0 32 32" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => {
                const a = (Math.PI / 6) * i;
                return <polygon key={i} points={points(16 + 11 * Math.sin(a), 16 - 11 * Math.cos(a))} />;
            })}
        </svg>
    );
}
