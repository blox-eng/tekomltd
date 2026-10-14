import type { Locale } from '@tekom/i18n';

const NUMBER_LOCALE: Record<Locale, string> = { bg: 'bg-BG', en: 'en-GB', de: 'de-DE' };

/** A number grouped per locale (as the mockup does), or text as given; an unconfirmed value gets an asterisk. */
export function formatStat(value: number | string, locale: Locale, unconfirmed: boolean): string {
    const formatted = typeof value === 'number' ? new Intl.NumberFormat(NUMBER_LOCALE[locale]).format(value) : value;
    return unconfirmed ? `${formatted}*` : formatted;
}
