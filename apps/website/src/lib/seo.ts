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
export const languageUrls = (path: string): Record<string, string> => ({
    ...Object.fromEntries(LOCALES.map((l) => [l, urlFor(path, l)])),
    'x-default': urlFor(path, DEFAULT_LOCALE)
});

export function alternates(path: string, locale: Locale = DEFAULT_LOCALE): Metadata['alternates'] {
    return { canonical: urlFor(path, locale), languages: languageUrls(path) };
}

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
};

export function pageMetadata({ locale, path, title, absoluteTitle, description, image }: PageMeta): Metadata {
    const url = urlFor(path, locale);
    return {
        title: absoluteTitle ? { absolute: title } : title,
        description: description ?? undefined,
        alternates: alternates(path, locale),
        openGraph: {
            type: 'website',
            siteName: 'Tekom',
            locale,
            url,
            title,
            description: description ?? undefined,
            images: image ? [{ url: image.src, width: image.width, height: image.height, alt: image.alt }] : undefined
        }
    };
}
