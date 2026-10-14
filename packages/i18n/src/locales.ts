export const LOCALES = ['bg', 'en', 'de'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'bg';

export const LOCALE_NAMES: Record<Locale, string> = {
    bg: 'Български',
    en: 'English',
    de: 'Deutsch'
};
