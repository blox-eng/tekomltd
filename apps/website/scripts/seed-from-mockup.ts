/**
 * Seeds content/home.yaml, content/settings.yaml, content/eu-programmes.yaml and content/brands/ from the mockup
 * (design/mockup) and from the contact page of the WordPress snapshot. Run `pnpm import:wp` first: the programme
 * logos and the snapshot come from it. Every mockup string is read from the mockup's own script, never retyped.
 *
 *   pnpm seed:mockup
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import YAML from 'yaml';
import { MOCKUP_DIR, REPO_ROOT, readMockProjects, readMockup } from './lib/mockup';
import { htmlToText } from './wp-parse';

const CONTENT = join(REPO_ROOT, 'content');
const SNAPSHOT = join(REPO_ROOT, 'design', 'wordpress-snapshot');

/** Tekom was founded in 1991 (Martin, 2026-10-14). Stat values use `{years}`, counted from this year at build time. */
const FOUNDED = 1991;
const YEARS = '{years}';
/** Bulgaria adopted the euro on 2026-01-01 at this fixed rate; the programme posters give their budgets in leva. */
const BGN_PER_EUR = 1.95583;

const BRANDS: [name: string, file: string][] = [
    ['Baumit', 'baumit'],
    ['Sika', 'sika'],
    ['Knauf', 'knauf'],
    ['Mapei', 'mapei'],
    ['REHAU', 'rehau'],
    ['Wienerberger', 'wienerberger'],
    ['Schüco', 'schueco'],
    ['Rockwool', 'rockwool']
];

type T3 = { bg: string; en: string; de: string };
const l = (t: T3) => ({ bg: t.bg, en: t.en, de: t.de });
/** The mockup marks unconfirmed figures with a trailing `*`; the content keeps that as a flag instead. */
const unstar = (t: T3) => ({ bg: t.bg.replace(/\*$/, ''), en: t.en.replace(/\*$/, ''), de: t.de.replace(/\*$/, '') });
const write = (file: string, data: unknown) => writeFileSync(join(CONTENT, file), YAML.stringify(data, { lineWidth: 0 }));

function home() {
    const { SVC, CREW, CREWS, PSVC, PARTNERS, T } = readMockup();
    if (PARTNERS.length) throw new Error('the mockup now lists partners; partners stay empty until Tekom names them');
    const projects = readMockProjects();
    const area = projects.reduce((sum, p) => sum + (p.a ?? 0), 0);

    const capability = SVC.map((s) => ({
        kind: 'capability' as const,
        after_project_index: s.after,
        accent: s.cls === 'red',
        label: l(s.k),
        title: l(s.t),
        body: l(s.d)
    }));
    // The "25 years" figure is the company's age: it now comes from the founding year and is confirmed.
    const crewStats = CREW.map((c) => ({
        kind: 'crew_stat' as const,
        after_project_index: c.after,
        stat_value: c.big === '25' ? YEARS : c.big,
        unit: unstar(c.u),
        body: l(c.d),
        unconfirmed: false
    }));
    const promises = (T.r as Record<'bg' | 'en' | 'de', [string, string][]>).bg.map((_, i) => {
        const pair = (locale: 'bg' | 'en' | 'de') => (T.r as Record<'bg' | 'en' | 'de', [string, string][]>)[locale][i]!;
        return { title: { bg: pair('bg')[0], en: pair('en')[0], de: pair('de')[0] }, body: { bg: pair('bg')[1], en: pair('en')[1], de: pair('de')[1] } };
    });
    const label = (key: string) => T[key] as T3;
    const stats = [
        { value: YEARS, label: unstar(label('n1')), unconfirmed: false },
        // Numbers stay numbers; the renderer formats them per locale, as the mockup does with toLocaleString.
        { value: Math.round(area / 1000) * 1000, label: l(label('n2')), unconfirmed: false },
        { value: projects.length, label: l(label('n3')), unconfirmed: false },
        { value: 1, label: unstar(label('n4')), unconfirmed: true }
    ];
    const crews = CREWS.map((c) => ({
        key: c.scene,
        scene: c.scene,
        title: l(c.t),
        body: l(c.d),
        roles: c.m.map((m) => ({ tool: m.i, role: l(m.r), years: m.y, quip: l(m.q) }))
    }));

    mkdirSync(join(CONTENT, 'brands'), { recursive: true });
    for (const [, file] of BRANDS) copyFileSync(join(MOCKUP_DIR, 'logos', `${file}.png`), join(CONTENT, 'brands', `${file}.png`));

    write('home.yaml', {
        rail_panels: [...capability, ...crewStats].sort((a, b) => a.after_project_index - b.after_project_index),
        promises,
        stats,
        crews,
        partner_services: PSVC.map((s) => ({ icon: s.i, title: l(s.t), body: l(s.d) })),
        materials: BRANDS.map(([name, file]) => ({ name, logo: `brands/${file}.png` })),
        partners: []
    });
}

/** Phones, address, hours and e-mail as the live contact page shows them. */
function contactFacts() {
    const pages = JSON.parse(readFileSync(join(SNAPSHOT, 'pages.json'), 'utf8')) as { id: number; content: { rendered: string } }[];
    const contact = pages.find((p) => p.id === 15);
    if (!contact) throw new Error('the snapshot has no contact page; run pnpm import:wp first');
    const text = htmlToText(contact.content.rendered);
    const phones = [...text.matchAll(/\+359 \d{2} \d{3} \d{4}/g)].map((m) => m[0]);
    const street = /ул\. .+? – Бизнес център ТЕКОМ/.exec(text)?.[0];
    const city = /Стара Загора, \d{4}/.exec(text)?.[0];
    const hours = /Пон – Пет .+?\d{1,2}\.\d{2} – \d{1,2}\.\d{2}/.exec(text)?.[0];
    const email = /[\w.]+@tekomltd\.com/.exec(text)?.[0];
    if (phones.length === 0 || !street || !city || !hours || !email) throw new Error(`cannot read the contact facts from: ${text}`);
    return { phones, address: `${street}, ${city}`, hours, email };
}

function settings() {
    const { T } = readMockup();
    const contact = contactFacts();
    const headline = T['crew.h'] as Record<'bg' | 'en' | 'de', string[]>;
    const phrases = (list: string[]) => list.slice(1).map((turn) => `${list[0]} ${turn}`);
    // The footer line „Администратор на лични данни: ТЕКОМ ООД · privacy@tekomltd.com“ names the privacy address.
    const privacyEmail = /[\w.]+@tekomltd\.com/.exec((T['f.made'] as T3).bg)![0];
    write('settings.yaml', {
        legal_name: 'ТЕКОМ ООД',
        founded: FOUNDED,
        address: {
            bg: contact.address,
            en: '119 Hadzhi Dimitar Asenov St, Tekom Business Centre, 6000 Stara Zagora, Bulgaria',
            de: 'ul. Hadzhi Dimitar Asenov 119, Businesszentrum Tekom, 6000 Stara Sagora, Bulgarien'
        },
        phone: contact.phones[0],
        hours: { bg: contact.hours, en: 'Mon–Fri 9:00–18:00', de: 'Mo–Fr 9:00–18:00' },
        email: contact.email,
        privacy_email: privacyEmail,
        socials: { linkedin: 'https://www.linkedin.com/company/tekom-engineering/' },
        crew_headline: { bg: phrases(headline.bg), en: phrases(headline.en), de: phrases(headline.de) },
        quote_cta: true,
        meta_title: l(T.h1 as T3)
    });
}

type ProgrammeSource = {
    intro: string;
    project?: string;
    budget: string;
    dates: string[];
    activities_heading: string;
    activities: string[];
    general_heading?: string;
    general?: string;
    specific_heading: string;
    specific: string[];
    results_heading: string;
    results: string[];
    budget_bgn: { total: number; eu: number };
    period: [string, string];
    logo: string;
};

function programmes() {
    const sources = JSON.parse(readFileSync(join(__dirname, 'data', 'eu-programmes.json'), 'utf8')) as Record<string, ProgrammeSource>;
    // Programme names as the mockup's EU page lists them.
    const tpl = readFileSync(join(MOCKUP_DIR, 'mockup.tpl.html'), 'utf8');
    const rowsSource = /const rows=(\[\[.+?\]\]);/.exec(tpl)?.[1];
    if (!rowsSource) throw new Error('mockup.tpl.html: cannot find the EU programme rows');
    const rows = runInNewContext(rowsSource, {}, { timeout: 1000 }) as [string, T3][];
    const list = (heading: string, items: string[]) => [heading, ...items.map((i) => `- ${i}`)].join('\n');
    const eur = (bgn: number) => Math.round((bgn / BGN_PER_EUR) * 100) / 100;

    write(
        'eu-programmes.yaml',
        rows.map(([code, title]) => {
            const s = sources[code];
            if (!s) throw new Error(`no programme text for ${code} in scripts/data/eu-programmes.json`);
            return {
                code,
                title: l(title),
                summary: { bg: [s.intro, s.project, s.budget, s.dates.join('\n'), list(s.activities_heading, s.activities)].filter(Boolean).join('\n\n') },
                objectives: {
                    bg: [s.general ? `${s.general_heading}\n${s.general}` : null, list(s.specific_heading, s.specific)].filter(Boolean).join('\n\n')
                },
                results: { bg: s.results.length === 1 ? `${s.results_heading}\n${s.results[0]}` : list(s.results_heading, s.results) },
                total_budget_eur: eur(s.budget_bgn.total),
                eu_contribution_eur: eur(s.budget_bgn.eu),
                period_start: s.period[0],
                period_end: s.period[1],
                programme_logo: s.logo
            };
        })
    );
}

mkdirSync(CONTENT, { recursive: true });
home();
settings();
programmes();
console.log('seed:mockup: wrote home.yaml, settings.yaml, eu-programmes.yaml and brands/');
