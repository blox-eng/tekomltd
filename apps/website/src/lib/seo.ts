import type { Metadata } from 'next';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@tekom/i18n';
import { localePath } from '../i18n/routing';

/** Production origin; the Netlify demo overrides it with SITE_URL. */
export const SITE_URL = (process.env.SITE_URL ?? 'https://tekomltd.com').replace(/\/+$/, '');

/** Absolute public URL of `path` in `locale`. */
export const urlFor = (path: string, locale: Locale) => {
    const localized = localePath(path, locale);
    return `${SITE_URL}${localized}`;
};

/** hreflang URLs of `path`: every locale plus x-default (Bulgarian). */
export const languageUrls = (path: string, fallbackLocales: readonly Locale[] = []): Record<string, string> => ({
    ...Object.fromEntries(publishedLocales(fallbackLocales).map((l) => [l, urlFor(path, l)])),
    'x-default': urlFor(path, DEFAULT_LOCALE)
});

/** Locales that carry their own content; a fallback locale only repeats the Bulgarian page. */
export const publishedLocales = (fallbackLocales: readonly Locale[] = []) => LOCALES.filter((l) => !fallbackLocales.includes(l));

/** A fallback locale points its canonical at the Bulgarian page and is left out of hreflang. */
export function alternates(path: string, locale: Locale = DEFAULT_LOCALE, fallbackLocales: readonly Locale[] = []): Metadata['alternates'] {
    const canonicalLocale = fallbackLocales.includes(locale) ? DEFAULT_LOCALE : locale;
    return { canonical: urlFor(path, canonicalLocale), languages: languageUrls(path, fallbackLocales) };
}

const OG_LOCALE: Record<Locale, string> = { bg: 'bg_BG', en: 'en_US', de: 'de_DE' };

const MAX_DESCRIPTION = 160;

/** First sentences of `text` that fit a search snippet. */
export function describe(text: string): string {
    const plain = text
        .replace(/[#*_>`[\]]|\(\S+\)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (plain.length <= MAX_DESCRIPTION) return plain;
    const cut = plain.slice(0, MAX_DESCRIPTION);
    const sentence = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    if (sentence > 60) return cut.slice(0, sentence + 1);
    return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

type PageMeta = {
    locale: Locale;
    path: string;
    title: string;
    /** Use the title as given, without the "· Tekom" suffix. */
    absoluteTitle?: boolean;
    description?: string | null;
    image?: { src: string; width: number; height: number; alt: string } | null;
    /** Locales of this page that show Bulgarian text instead of a translation. */
    fallbackLocales?: readonly Locale[];
};

export function pageMetadata({ locale, path, title, absoluteTitle, description, image, fallbackLocales = [] }: PageMeta): Metadata {
    const alt = alternates(path, locale, fallbackLocales);
    return {
        title: absoluteTitle ? { absolute: title } : title,
        description: description ?? undefined,
        alternates: alt,
        openGraph: {
            type: 'website',
            siteName: 'Tekom',
            locale: OG_LOCALE[locale],
            url: alt?.canonical as string,
            title,
            description: description ?? undefined,
            images: image ? [{ url: image.src, width: image.width, height: image.height, alt: image.alt }] : undefined
        }
    };
}
