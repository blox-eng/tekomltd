import type { Locale } from '@tekom/i18n';

const INTL_LOCALE: Record<Locale, string> = { bg: 'bg-BG', en: 'en-GB', de: 'de-DE' };

export const formatEur = (amount: number, locale: Locale) =>
    new Intl.NumberFormat(locale === 'en' ? 'en-IE' : INTL_LOCALE[locale], { style: 'currency', currency: 'EUR' }).format(amount);

/** A calendar date (YYYY-MM-DD) as day, month name and year, independent of the build machine's time zone. */
export const formatDate = (isoDate: string, locale: Locale) =>
    new Intl.DateTimeFormat(INTL_LOCALE[locale], { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${isoDate}T00:00:00Z`));

export function formatSize(bytes: number): string {
    if (bytes < 1_000_000) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
