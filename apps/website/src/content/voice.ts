/**
 * The machine-checkable part of docs/VOICE.md: no em dash, no price words, no luxury or bargain words.
 * Each entry matches a whole word, so "оценка" and "съинвеститор" pass.
 */
const BANNED = [
    // bg
    'цена',
    'цени',
    'цената',
    'цените',
    'оферт\\p{L}*',
    'бюджет\\p{L}*',
    'евтин\\p{L}*',
    'спестява\\p{L}*',
    'инвестици\\p{L}*',
    'договаряме',
    'висок клас',
    'лукс\\p{L}*',
    'премиум',
    'мечт\\p{L}*',
    'уникал\\p{L}*',
    'ексклузив\\p{L}*',
    'перфект\\p{L}*',
    // en
    'price',
    'prices',
    'pricing',
    'quote',
    'quotes',
    'quotation',
    'budget\\p{L}*',
    'cheap\\p{L}*',
    'affordab\\p{L}*',
    'premium',
    'luxur\\p{L}*',
    'high-end',
    'exclusive',
    'dream\\p{L}*',
    'unique',
    'perfect\\p{L}*',
    'bespoke',
    // de
    'Preis\\p{L}*',
    'Angebot\\p{L}*',
    'Kostenvoranschl\\p{L}*',
    'günstig\\p{L}*',
    'billig\\p{L}*',
    'Luxus',
    'luxuriös\\p{L}*',
    'hochwertig\\p{L}*',
    'exklusiv\\p{L}*',
    'Traum\\p{L}*',
    'einzigartig\\p{L}*',
    'perfekt\\p{L}*'
];
const BANNED_WORD = new RegExp(`(?<![\\p{L}\\p{N}-])(?:${BANNED.join('|')})(?![\\p{L}\\p{N}])`, 'giu');

/** What breaks the site's voice in one text, as messages a writer can act on. */
export function voiceProblems(text: string): string[] {
    const problems: string[] = [];
    if (text.includes('—')) problems.push('em dash (—): use a comma, a colon or a new sentence');
    for (const [word] of text.matchAll(BANNED_WORD)) problems.push(`"${word}": no price, luxury or bargain words (docs/VOICE.md)`);
    return problems;
}
