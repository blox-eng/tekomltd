import { getTranslations } from 'next-intl/server';
import { Button, TekomMark } from '@tekom/ui';
import type { Locale } from '@tekom/i18n';
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

    return (
        <header className="site-header">
            <div className="wrap">
                <Link href="/" className="logo" aria-label="Tekom home">
                    <TekomMark className="logo-mark" />
                    <span className="logo-word">{brandName(locale).toUpperCase()}</span>
                </Link>
                <NavLinks
                    items={[
                        { href: '/projects', label: t('projects') },
                        { href: '/eu-programmes', label: t('eu') },
                        { href: '/contact', label: t('contact') }
                    ]}
                />
                <div className="tools">
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
