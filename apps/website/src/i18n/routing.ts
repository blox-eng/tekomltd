import { defineRouting } from 'next-intl/routing';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@tekom/i18n';

export const routing = defineRouting({
    locales: LOCALES,
    defaultLocale: DEFAULT_LOCALE,
    localePrefix: 'as-needed',
    // The site sets no cookie and never redirects on Accept-Language.
    localeCookie: false,
    localeDetection: false,
    // Pages set their own hreflang alternates, which leave out locales that only show the Bulgarian fallback.
    alternateLinks: false
});

/** Public path of `path` in `locale`: Bulgarian has no prefix. */
export function localePath(path: string, locale: Locale): string {
    if (locale === DEFAULT_LOCALE) return path;
    return path === '/' ? `/${locale}` : `/${locale}${path}`;
}
