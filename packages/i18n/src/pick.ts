import { DEFAULT_LOCALE, type Locale } from './locales';

function read(row: Record<string, unknown>, field: string, locale: Locale): string | null {
    const value = row[`${field}_${locale}`];
    return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function pick(row: Record<string, unknown>, field: string, locale: Locale): { text: string; fallback: boolean } {
    const text = read(row, field, locale);
    if (text !== null) return { text, fallback: false };
    return { text: read(row, field, DEFAULT_LOCALE) ?? '', fallback: locale !== DEFAULT_LOCALE };
}
