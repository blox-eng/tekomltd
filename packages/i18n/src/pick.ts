import { DEFAULT_LOCALE, LOCALES, type Locale } from './locales';

type Picked = { text: string; fallback: boolean };

function clean(value: unknown): string | null {
    return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/** Picks from a localised object such as `{ bg, en?, de? }`. Blank text counts as missing. */
export function pickL(l: Partial<Record<Locale, unknown>>, locale: Locale): Picked {
    const text = clean(l[locale]);
    if (text !== null) return { text, fallback: false };
    return { text: clean(l[DEFAULT_LOCALE]) ?? '', fallback: locale !== DEFAULT_LOCALE };
}

/** Picks from a row with `<field>_<locale>` keys. */
export function pick(row: Record<string, unknown>, field: string, locale: Locale): Picked {
    return pickL(Object.fromEntries(LOCALES.map((l) => [l, row[`${field}_${l}`]])), locale);
}
