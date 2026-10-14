export const EXCERPT_MAX = 460;
const FALLBACK_CUT = 400;
const EXCERPT_MIN = 180;

const NAMED: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: '\u00a0',
    ndash: '–',
    mdash: '—',
    hellip: '…',
    laquo: '«',
    raquo: '»',
    bdquo: '„',
    ldquo: '“',
    rdquo: '”',
    lsquo: '‘',
    rsquo: '’',
    times: '×'
};

export function decodeEntities(s: string): string {
    return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
        if (code[0] === '#') {
            const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
            return Number.isFinite(n) ? String.fromCodePoint(n) : whole;
        }
        return NAMED[code.toLowerCase()] ?? whole;
    });
}

/** Visible text of WordPress HTML on one line: tags and shortcodes dropped, entities decoded, whitespace collapsed. */
export function htmlToText(html: string): string {
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\[[^\]]*\]/g, ' ');
    return decodeEntities(text.replace(/\s+/g, ' ')).replace(/\s+/g, ' ').trim();
}

const LABELS = ['ДАТА', 'АДРЕС', 'ТИП СГРАДА', 'ТИП ОБЕКТ', 'ЗАСТРОЕНА ПЛОЩ', 'РЗП', 'ОБЕМ', 'МЕСТА', 'Галерия'];
const LABEL_RE = new RegExp(`(?:^|\\s)(${LABELS.join('|')})(?=\\s|$)`, 'g');

/** Reads the "ДАТА / АДРЕС / ЗАСТРОЕНА ПЛОЩ" block that closes every WordPress project. */
export function parseDetails(html: string): { date: string | null; address: string | null; areaM2: number | null } {
    const text = htmlToText(html);
    const start = text.lastIndexOf('ДАТА');
    if (start < 0) return { date: null, address: null, areaM2: null };
    const block = text.slice(start);
    const fields = new Map<string, string>();
    const marks = [...block.matchAll(LABEL_RE)];
    marks.forEach((m, i) => {
        const from = m.index + m[0].length;
        const to = i + 1 < marks.length ? marks[i + 1]!.index : block.length;
        if (!fields.has(m[1]!)) fields.set(m[1]!, block.slice(from, to).trim());
    });
    const value = (label: string) => {
        const v = fields.get(label);
        return v && v !== '?' ? v : null;
    };
    const area = /^([\d\s]+?)\s*кв/.exec(value('ЗАСТРОЕНА ПЛОЩ') ?? value('РЗП') ?? '');
    return { date: value('ДАТА'), address: value('АДРЕС'), areaM2: area ? Number(area[1]!.replace(/\s/g, '')) : null };
}

const OPENERS = /(Сградата|Къщата|Комплекс|Този|Тази|Обектът|Параклисът|Басейнът|Проектирана)/;
// No sentence ends after these abbreviations or after an initial ("Х. Д. Асенов").
const ABBREVIATIONS = ['ул', 'инж', 'арх', 'гр', 'с', 'кв', 'Х', 'Д', 'г'];
const SENTENCE_END = new RegExp(`${ABBREVIATIONS.map((a) => `(?<!(?<!\\p{L})${a})`).join('')}\\.[“”"]?(?=\\s+[А-ЯA-Z])`, 'gu');

/** The Bulgarian description of a project, cut at the last real sentence end within 460 characters (the rule of the mockup's build.py). */
export function excerpt(html: string): string {
    let text = htmlToText(html).split(/\s(?:ДАТА|Детайли)\s/)[0]!;
    const opener = OPENERS.exec(text);
    if (opener) text = text.slice(opener.index);
    const ends = [...text.matchAll(SENTENCE_END)].map((m) => m.index + m[0].length).filter((end) => end >= EXCERPT_MIN && end <= EXCERPT_MAX);
    if (ends.length) return text.slice(0, ends.at(-1));
    const cut = text.slice(0, FALLBACK_CUT);
    return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

const UPLOAD_IMAGE = /\/wp-content\/uploads\/[^"'\s]+\.(?:jpe?g|png|webp|gif)$/i;
const SIZE_SUFFIX = /-\d+x\d+(\.[a-z]+)$/i;
const SCALED_SUFFIX = /-scaled(\.[a-z]+)$/i;

/** Full-size gallery images in document order: WordPress thumbnails (-NNNxNNN) map to their original, one URL per picture. */
export function galleryUrls(html: string): string[] {
    const byKey = new Map<string, string>();
    for (const m of html.matchAll(/\s(?:href|src|data-orig-src)="([^"]+)"/g)) {
        const raw = decodeEntities(m[1]!);
        if (!UPLOAD_IMAGE.test(raw)) continue;
        const url = raw.replace(SIZE_SUFFIX, '$1');
        const key = url.replace(SCALED_SUFFIX, '$1').toLowerCase();
        const seen = byKey.get(key);
        if (seen === undefined || (!SCALED_SUFFIX.test(seen) && SCALED_SUFFIX.test(url))) byKey.set(key, url);
    }
    return [...byKey.values()];
}

/** The picture behind a WordPress image URL, whatever size variant it names. */
export const imageKey = (url: string) => decodeURI(url).replace(SIZE_SUFFIX, '$1').replace(SCALED_SUFFIX, '$1').toLowerCase();

const TRANSLIT: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'h',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'sht',
    ъ: 'a',
    ь: 'y',
    ю: 'yu',
    я: 'ya'
};

/** A safe lowercase ASCII file name; Bulgarian is transliterated (streamlined system). */
export function slugifyFile(name: string): string {
    const dot = name.lastIndexOf('.');
    const base = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
    const slug = [...base.toLowerCase()]
        .map((c) => TRANSLIT[c] ?? c)
        .join('')
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return ext ? `${slug || 'file'}.${ext}` : slug || 'file';
}
