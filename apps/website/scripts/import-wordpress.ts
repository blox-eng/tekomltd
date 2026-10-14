/**
 * Imports the current tekomltd.com (WordPress) into `content/` and keeps a raw snapshot in `design/wordpress-snapshot/`.
 *
 *   pnpm import:wp                 snapshot, the 17 projects with every gallery image, the pages without a mockup slot, the programme logos
 *   pnpm import:wp --publications  snapshot, every document (PDF, DOC, DOCX) and the publications list
 *
 * Both runs rewrite `url-map.json` (old upload URL → new public URL) and `INVENTORY.md`. Re-running is safe: generated
 * fields and files are overwritten, fields a person added (translations, meta, drafts) are kept.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import YAML from 'yaml';
import { REPO_ROOT, readGeo, readMockProjects, readMockup } from './lib/mockup';
import { download, fetchCollection, saveImage, savePng, sha256, SITE, sitePath, type WpMedia, type WpPost } from './lib/wp';
import { wpPageToMarkdown } from './lib/wp-markdown';
import { decodeEntities, excerpt, galleryUrls, imageKey, parseDetails, slugifyFile } from './wp-parse';

const CONTENT = join(REPO_ROOT, 'content');
const SNAPSHOT = join(REPO_ROOT, 'design', 'wordpress-snapshot');
const URL_MAP_FILE = join(SNAPSHOT, 'url-map.json');
const MEDIA_URL = '/media';

const BG05 = 'BG05SFPR002-1.004-1772-C01';
const BG16 = 'BG16RFPR001-1.004';

/** Pages whose content has a place in the mockup. */
const SLOT_PAGES: Record<number, string> = {
    5: 'content/home.yaml (the new home page comes from the mockup; the live copy stays in pages.json)',
    11: 'content/projects/ (the 17 projects)',
    15: 'content/settings.yaml (phones, e-mail, address, office hours)',
    3: 'content/legal/privacy.*.md (rewritten for the static site)',
    1815: 'content/publications.yaml and content/eu-programmes.yaml'
};
/** Pages without a mockup slot, kept as Markdown under content/pages/<slug>.bg.md. */
const MARKDOWN_PAGES = [7, 1376, 1375, 9, 1405, 1924];
/** Programme logos on the old home page. */
const PROGRAMME_LOGOS: Record<string, string> = { 'OPRCHR-logo.png': 'eu-programmes/oprchr-logo.png', 'news_banner_pkip-1.webp': 'eu-programmes/pkip.png' };
/** Publicity posters published as images. */
const IMAGE_PUBLICATIONS = ['/wp-content/uploads/2025/06/semeini.png'];
const EUMIS = 'https://eumis2020.government.bg/';

type Snapshot = { pages: WpPost[]; portfolio: WpPost[]; media: WpMedia[]; mediaTotal: number };
type UrlMap = { files: Record<string, string>; pages: Record<string, string> };
type Doc = {
    urls: string[];
    mediaIds: number[];
    file: string;
    title: string;
    kind: 'eu_notice' | 'procurement' | 'other';
    programme?: string;
    publishedOn: string;
    wpUrl?: string;
};

const publicationsOnly = process.argv.includes('--publications');

async function main() {
    const snap = await snapshot();
    const docs = await planDocuments(snap);
    const urlMap = readUrlMap();
    // Each run owns its part of the URL map: the documents, or everything else.
    const isDocument = (to: string) => to.startsWith(`${MEDIA_URL}/publications/`);
    urlMap.files = Object.fromEntries(Object.entries(urlMap.files).filter(([, to]) => isDocument(to) !== publicationsOnly));
    if (publicationsOnly) {
        await importPublications(docs, urlMap);
    } else {
        await importProjects(snap, urlMap);
        await importPages(snap, docs, urlMap);
        await importProgrammeLogos(snap, urlMap);
    }
    writeJson(URL_MAP_FILE, sortMap(urlMap));
    writeFileSync(join(SNAPSHOT, 'INVENTORY.md'), inventory(snap, docs, urlMap));
    console.log(`import:wp: done (${publicationsOnly ? 'publications' : 'projects and pages'}); see design/wordpress-snapshot/INVENTORY.md`);
}

// ---------- snapshot

async function snapshot(): Promise<Snapshot> {
    mkdirSync(SNAPSHOT, { recursive: true });
    const out: Record<string, unknown[]> = {};
    let mediaTotal = 0;
    for (const endpoint of ['pages', 'avada_portfolio', 'categories', 'portfolio_category', 'posts', 'media']) {
        const { items, total } = await fetchCollection<{ id: number }>(endpoint);
        items.sort((a, b) => a.id - b.id);
        out[endpoint] = items;
        if (endpoint === 'media') mediaTotal = total;
        writeJson(join(SNAPSHOT, `${endpoint}.json`), items);
        console.log(`snapshot: ${endpoint} ${items.length}${total !== items.length ? ` (WordPress reports ${total})` : ''}`);
    }
    return { pages: out.pages as WpPost[], portfolio: out.avada_portfolio as WpPost[], media: out.media as WpMedia[], mediaTotal };
}

// ---------- documents

const DOC_TITLES: [RegExp, string][] = [
    [/Публ.*пок.*на|Публична.покана/i, 'Публична покана'],
    [/Декл/i, 'Декларация на кандидата'],
    [/Образец.на.оферта/i, 'Образец на оферта'],
    [/Проект.договор/i, 'Проект на договор'],
    [/Изисквания.към.офертите/i, 'Изисквания към офертите'],
    [/Методика.за.оценка/i, 'Методика за оценка'],
    [/Пр_1_Усл/i, 'Приложение 1: Условия за изпълнение'],
    [/Приемо-предавателен.протокол.мостри/i, 'Приемо-предавателен протокол мостри'],
    [/Публ.-сайт_Теком|semeini/i, 'Публикация за проекта']
];
const ISO: Record<string, string> = { QS: 'ISO 9001:2015', ES: 'ISO 14001:2015', OHSS: 'ISO 45001:2018' };

function docTitle(name: string, url: string): string {
    const iso = /(BG|EN)24-183116(QS|OHSS|ES)/.exec(name);
    if (iso) return `Сертификат ${ISO[iso[2]!]} (${iso[1] === 'BG' ? 'на български' : 'на английски'})`;
    const known = DOC_TITLES.find(([re]) => re.test(name));
    const title = known ? known[1] : name.replace(/_/g, ' ');
    return /\.docx?$/i.test(url) ? `${title} (DOCX)` : title;
}

function docProgramme(path: string): { kind: Doc['kind']; programme?: string } {
    if (/EN24|BG24/.test(path)) return { kind: 'other' };
    if (/semeini/.test(path)) return { kind: 'eu_notice', programme: BG16 };
    if (/Публ.-сайт_Теком/.test(path)) return { kind: 'eu_notice', programme: BG05 };
    if (/\/2026\/03\//.test(path)) return { kind: 'procurement', programme: BG16 };
    return { kind: 'procurement', programme: BG05 };
}

/** Every document of the site: the non-image media files, the publicity posters and the procurement files the old site linked on eumis2020. */
async function planDocuments(snap: Snapshot): Promise<Doc[]> {
    const linked = new Set<string>();
    for (const page of snap.pages) for (const m of page.content.rendered.matchAll(/href="([^"]+)"/g)) linked.add(decodeEntities(m[1]!));
    const linkedPath = (url: string) => [...linked].some((l) => l.startsWith(SITE) && sitePath(l) === sitePath(url));

    type Source = { url: string; media?: WpMedia; date: string; name: string; body: Buffer };
    const sources: Source[] = [];
    for (const media of snap.media) {
        const path = sitePath(media.source_url);
        if (media.mime_type.startsWith('image/') && !IMAGE_PUBLICATIONS.includes(path)) continue;
        const { body } = await download(media.source_url);
        sources.push({ url: media.source_url, media, date: media.date.slice(0, 10), name: basename(path), body });
    }
    const publications = snap.pages.find((p) => p.id === 1815)!;
    for (const m of publications.content.rendered.matchAll(/<a [^>]*href="([^"]+)"[^>]*>\s*<img[^>]*src="([^"]+)"/g)) {
        const url = decodeEntities(m[1]!);
        if (!url.startsWith(EUMIS)) continue;
        const thumb = snap.media.find((x) => imageKey(x.source_url) === imageKey(decodeEntities(m[2]!)));
        const { body, filename } = await download(url);
        sources.push({ url, date: (thumb?.date ?? publications.modified).slice(0, 10), name: filename ?? `eumis-${sources.length}.pdf`, body });
    }

    const groups = new Map<string, Source[]>();
    for (const s of sources) groups.set(sha256(s.body), [...(groups.get(sha256(s.body)) ?? []), s]);

    const docs: Doc[] = [];
    const usedFiles = new Set<string>();
    for (const group of groups.values()) {
        const rank = (s: Source) => (s.url.startsWith(EUMIS) ? 2 : linkedPath(s.url) ? 0 : 1);
        group.sort((a, b) => rank(a) - rank(b) || (a.media?.id ?? 0) - (b.media?.id ?? 0));
        const main = group[0]!;
        // Files that only exist on eumis2020 get their own prefix, so their names never depend on the order of the run.
        let file = `publications/${main.date.slice(0, 7)}-${main.url.startsWith(EUMIS) ? 'eumis-' : ''}${slugifyFile(main.name)}`;
        for (let n = 2; usedFiles.has(file); n++) file = file.replace(/(-\d+)?(\.[a-z]+)$/, `-${n}$2`);
        usedFiles.add(file);
        mkdirSync(join(CONTENT, 'publications'), { recursive: true });
        const local = group.find((s) => !s.url.startsWith(EUMIS));
        docs.push({
            urls: group.map((s) => s.url),
            mediaIds: group.flatMap((s) => (s.media ? [s.media.id] : [])),
            file,
            title: docTitle(main.media ? decodeEntities(main.media.title.rendered) : main.name, main.name),
            ...docProgramme(main.media ? sitePath(main.url) : main.name),
            publishedOn: main.date,
            ...(local ? { wpUrl: local.url } : {})
        });
        writeFileIfChanged(join(CONTENT, file), main.body);
    }
    return docs.sort((a, b) => b.publishedOn.localeCompare(a.publishedOn) || a.file.localeCompare(b.file));
}

async function importPublications(docs: Doc[], urlMap: UrlMap) {
    const rows = docs.map((d) => ({
        ...(d.programme ? { programme: d.programme } : {}),
        kind: d.kind,
        title: { bg: d.title },
        file: d.file,
        published_on: d.publishedOn,
        ...(d.wpUrl ? { wp_url: d.wpUrl } : {})
    }));
    writeYaml(join(CONTENT, 'publications.yaml'), rows);
    for (const d of docs) for (const url of d.urls) if (url.startsWith(SITE)) urlMap.files[sitePath(url)] = `${MEDIA_URL}/${d.file}`;
    console.log(`publications: ${docs.length} documents from ${docs.reduce((n, d) => n + d.urls.length, 0)} links`);
}

// ---------- projects

async function importProjects(snap: Snapshot, urlMap: UrlMap) {
    const mockup = readMockup();
    const geo = readGeo();
    const byId = new Map(snap.portfolio.map((p) => [p.id, p]));
    const mediaById = new Map(snap.media.map((m) => [m.id, m]));
    const mock = readMockProjects();
    let images = 0;
    for (const [index, p] of mock.entries()) {
        const wp = byId.get(p.id);
        if (!wp) throw new Error(`portfolio item ${p.id} (${p.slug}) is not on the live site`);
        const dir = join(CONTENT, 'projects', p.slug);
        const file = join(dir, 'project.yaml');
        const existing = existsSync(file) ? (YAML.parse(readFileSync(file, 'utf8')) as Record<string, unknown>) : {};
        // A featured image attached to an unpublished post is not in the public media library; Yoast still names it.
        const cover = mediaById.get(wp.featured_media ?? 0)?.source_url ?? wp.yoast_head_json?.og_image?.[0]?.url;
        if (!cover) throw new Error(`no cover image for ${p.slug} (media ${wp.featured_media})`);

        const urls: string[] = [];
        for (const url of [cover, ...galleryUrls(wp.content.rendered)]) if (!urls.some((u) => imageKey(u) === imageKey(url))) urls.push(url);
        const keptAlt = new Map<string, Record<string, string>>(
            ((existing.images as { file: string; alt?: Record<string, string> }[] | undefined) ?? []).map((i) => [i.file, i.alt ?? {}])
        );
        const title = p.t;
        const written: { file: string; alt: Record<string, string>; is_cover?: true }[] = [];
        const names = new Set<string>();
        for (const url of urls) {
            let name = slugifyFile(basename(sitePath(url))).replace(/(-scaled)?\.[a-z]+$/, '');
            for (let n = 2; names.has(name); n++) name = `${name}-${n}`;
            names.add(name);
            const out = await saveImage((await download(url)).body, join(dir, name));
            const rel = basename(out);
            written.push({ file: rel, alt: { ...keptAlt.get(rel), bg: title.bg }, ...(written.length === 0 ? { is_cover: true as const } : {}) });
            urlMap.files[sitePath(url)] = `${MEDIA_URL}/projects/${p.slug}/${rel}`;
            images++;
        }
        removeStaleImages(dir, new Set(written.map((w) => w.file)));

        const details = parseDetails(wp.content.rendered);
        const [lat, lng] = geo[String(p.id)] ?? [];
        const place = mockup.PLACE[p.place];
        const summary = { ...((existing.summary as object) ?? {}), bg: excerpt(wp.content.rendered) };
        const project = {
            ...existing,
            slug: p.slug,
            title: { bg: title.bg, en: title.en, de: title.de },
            summary,
            place: place ? { bg: p.place, en: place.en, de: place.de } : { bg: p.place },
            address: p.addr || details.address,
            ...(lat !== undefined && lng !== undefined ? { lat, lng, show_on_map: true } : {}),
            ...(p.y ? { year: p.y } : {}),
            ...((p.a ?? details.areaM2) ? { built_area_m2: p.a ?? details.areaM2 } : {}),
            scopes: p.s,
            sort: index + 1,
            wide: Boolean(p.wide),
            on_rail: true,
            wp_id: wp.id,
            wp_slug: decodeURIComponent(wp.slug),
            images: written
        };
        writeYaml(file, project);
    }
    console.log(`projects: ${mock.length} projects, ${images} images`);
}

function removeStaleImages(dir: string, keep: Set<string>) {
    for (const name of readdirSync(dir)) if (/\.(jpe?g|png|webp)$/i.test(name) && !keep.has(name)) rmSync(join(dir, name));
}

// ---------- pages

async function importPages(snap: Snapshot, docs: Doc[], urlMap: UrlMap) {
    const docByPath = new Map<string, Doc>();
    for (const d of docs) for (const url of d.urls) if (url.startsWith(SITE)) docByPath.set(sitePath(url), d);
    const pageBySlug = new Map(snap.pages.map((p) => [p.slug, p]));
    const newPage = (p: WpPost) => (MARKDOWN_PAGES.includes(p.id) ? p.slug : null);

    for (const id of MARKDOWN_PAGES) {
        const page = snap.pages.find((p) => p.id === id)!;
        const dir = join(CONTENT, 'pages', page.slug);
        const saved = new Set<string>();
        const body = await wpPageToMarkdown(page.content.rendered, {
            document: (url) => {
                const d = docByPath.get(sitePath(url));
                return d ? { href: `${MEDIA_URL}/${d.file}`, title: d.title } : null;
            },
            image: async (url) => {
                const name = slugifyFile(basename(sitePath(url))).replace(/\.[a-z]+$/, '');
                const out = await saveImage((await download(url)).body, join(dir, name), true);
                const href = `${MEDIA_URL}/${relative(CONTENT, out).split('\\').join('/')}`;
                saved.add(basename(out));
                urlMap.files[sitePath(url)] = href;
                return href;
            },
            sitePage: (path) => {
                // The old site links some pages without their parent (/business-services/); WordPress redirected those by slug.
                if (path === '/') return '/';
                const slug = path.split('/').filter(Boolean).at(-1);
                const target = slug ? pageBySlug.get(decodeURIComponent(slug)) : undefined;
                return target ? sitePath(target.link) : null;
            }
        });
        if (existsSync(dir)) removeStaleImages(dir, saved);
        const front = { title: decodeEntities(page.title.rendered), updated: page.modified.slice(0, 10), wp_url: page.link };
        writeFileIfChanged(join(CONTENT, 'pages', `${page.slug}.bg.md`), `---\n${YAML.stringify(front, { lineWidth: 0 })}---\n\n${body}`);
        urlMap.pages[sitePath(page.link)] = page.slug;
    }
    for (const page of snap.pages) if (!newPage(page) && SLOT_PAGES[page.id]) urlMap.pages[sitePath(page.link)] = SLOT_PAGES[page.id]!.split(' ')[0]!;
    console.log(`pages: ${MARKDOWN_PAGES.length} Markdown pages`);
}

async function importProgrammeLogos(snap: Snapshot, urlMap: UrlMap) {
    for (const [name, target] of Object.entries(PROGRAMME_LOGOS)) {
        const media = snap.media.find((m) => basename(sitePath(m.source_url)) === name);
        if (!media) throw new Error(`programme logo ${name} is not in the media library`);
        await savePng((await download(media.source_url)).body, join(CONTENT, target));
        urlMap.files[sitePath(media.source_url)] = `${MEDIA_URL}/${target}`;
    }
}

// ---------- inventory

function inventory(snap: Snapshot, docs: Doc[], urlMap: UrlMap): string {
    const key = (url: string) => imageKey(sitePath(url));
    const docByPath = new Map<string, Doc>();
    for (const d of docs) for (const url of d.urls) docByPath.set(url.startsWith(SITE) ? sitePath(url) : url, d);
    const newHomeByKey = new Map<string, string>();
    for (const [from, to] of Object.entries(urlMap.files)) newHomeByKey.set(key(from), `content${to.slice(MEDIA_URL.length)}`);

    const where = new Map<string, string[]>();
    const note = (key: string, label: string) => where.set(key, [...new Set([...(where.get(key) ?? []), label])]);
    for (const p of snap.pages)
        for (const m of p.content.rendered.matchAll(/(?:href|src)="([^"]+\/wp-content\/uploads\/[^"]+)"/g))
            note(key(m[1]!), `page ${p.slug === '%d0%bd%d0%b0%d1%87%d0%b0%d0%bb%d0%be' ? 'home' : decodeURIComponent(p.slug)}`);
    for (const p of snap.portfolio)
        for (const m of p.content.rendered.matchAll(/(?:href|src)="([^"]+\/wp-content\/uploads\/[^"]+)"/g)) note(key(m[1]!), `project ${p.id}`);
    const pageName = new Map(snap.pages.map((p) => [p.id, p.id === 5 ? 'home' : decodeURIComponent(p.slug)]));
    const projectSlug = new Map(readMockProjects().map((p) => [p.id, p.slug]));

    /** Why a file of the old site has no place in content/. */
    const reasonForPath = (path: string, post: number | null = null): string => {
        const refs = where.get(key(path)) ?? [];
        if (/-pdf(-\d+x\d+)?\.jpe?g$/i.test(path) || /\/2026\/07\/\d\.-/.test(path) || /Публ.-сайт_Теком\.\d/i.test(path) || /_Т(\.1)?\.jpe?g$/i.test(path)) {
            return 'not used: a picture of a document page, shown next to its download link; the document itself is imported';
        }
        if (refs.includes('page home')) return 'not used: image of the old home page; the new home page comes from the mockup';
        if (refs.some((r) => r === 'page projects' || r === 'page about'))
            return 'not used: thumbnail in the old project grid; the project photos are imported';
        if (refs.length) return `not used: shown on ${refs.join(', ')} only as a small preview; the full picture is imported where the page shows it`;
        if (post && projectSlug.has(post)) return `not used: attached to project ${projectSlug.get(post)} but not shown on its live page`;
        if (post && pageName.has(post)) return `not used: attached to page ${pageName.get(post)} but not shown on it`;
        if (/Tekom_Logo|favicon|cropped-/i.test(path)) return 'not used: old site logo or icon; the new logo ships with packages/ui';
        return 'not used: not referenced by any live page or project';
    };
    const reason = (m: WpMedia) => reasonForPath(sitePath(m.source_url), m.post);

    const rows = snap.media.map((m) => {
        const path = sitePath(m.source_url);
        const doc = docByPath.get(path);
        let home: string;
        if (doc)
            home =
                doc.urls[0] === m.source_url || !doc.mediaIds.length
                    ? `content/${doc.file}`
                    : `content/${doc.file} (byte-identical duplicate of #${doc.mediaIds[0]})`;
        else home = newHomeByKey.get(key(m.source_url)) ?? reason(m);
        return `| ${m.id} | ${m.date.slice(0, 10)} | ${m.mime_type.replace('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx')} | \`${path}\` | ${home} |`;
    });

    const mediaKeys = new Set(snap.media.map((m) => key(m.source_url)));
    const extra = [...where.entries()].filter(([k]) => !mediaKeys.has(k) && /\.(jpe?g|png|webp|gif|pdf|docx?)$/i.test(k));
    const extraRows = extra.map(([k, refs]) => `| \`${k}\` | ${refs.join(', ')} | ${newHomeByKey.get(k) ?? reasonForPath(k)} |`);
    // Featured images that are hidden from the media listing (named only by Yoast) are imported as project covers.
    for (const [from, to] of Object.entries(urlMap.files)) {
        if (!mediaKeys.has(key(from)) && !where.has(key(from)))
            extraRows.push(`| \`${from}\` | project cover (featured image) | content${to.slice(MEDIA_URL.length)} |`);
    }

    const eumis = docs.flatMap((d) =>
        d.urls.filter((u) => u.startsWith(EUMIS)).map((u) => `| ${u} | content/${d.file}${d.urls[0] === u ? '' : ' (same file as the upload)'} |`)
    );

    const pages = snap.pages.map((p) => {
        const home = SLOT_PAGES[p.id] ?? (MARKDOWN_PAGES.includes(p.id) ? `content/pages/${p.slug}.bg.md` : 'UNEXPLAINED');
        return `| ${p.id} | ${sitePath(p.link)} | ${decodeEntities(p.title.rendered)} | ${p.modified.slice(0, 10)} | ${home} |`;
    });
    const portfolio = snap.portfolio.map((p) => {
        const slug = projectSlug.get(p.id);
        return `| ${p.id} | ${sitePath(p.link)} | ${decodeEntities(p.title.rendered)} | ${slug ? `content/projects/${slug}/project.yaml` : 'UNEXPLAINED'} |`;
    });
    const used = snap.media.filter((m) => docByPath.has(sitePath(m.source_url)) || newHomeByKey.has(key(m.source_url))).length;

    return `# WordPress inventory

Generated by \`pnpm import:wp\` from https://www.tekomltd.com/wp-json/wp/v2/ on ${new Date().toISOString().slice(0, 10)}. Every page, portfolio item and media file of the
live site has a row with its new home in \`content/\` or the reason it is not used. The raw REST data is kept next to this file
(\`pages.json\`, \`avada_portfolio.json\`, \`media.json\`, \`categories.json\`, \`portfolio_category.json\`, \`posts.json\`), and
\`url-map.json\` maps every imported old URL to its new public URL for the redirects.

## Summary

- Pages: ${snap.pages.length} (${Object.keys(SLOT_PAGES).length} feed a mockup slot, ${MARKDOWN_PAGES.length} are kept as Markdown pages).
- Portfolio items: ${snap.portfolio.length}, all imported as projects.
- Posts: 0. Categories and portfolio categories: kept in the snapshot only; projects use the five scopes instead.
- Media: ${snap.media.length} public items (WordPress reports ${snap.mediaTotal}; the other ${snap.mediaTotal - snap.media.length} are not listed to anonymous requests, which WordPress does for attachments of unpublished or private posts; any of them a live page uses is in the table "Files referenced by the live content but not in the public media library"). ${used} are imported, ${snap.media.length - used} are not used (reasons below).
- Documents: ${docs.length} files in \`content/publications/\` (byte-identical uploads share one file).
- Procurement files the old /publications/ page linked on eumis2020.government.bg: ${eumis.length}, downloaded.

## Pages

| ID | Old URL | Title | Modified | New home |
|---|---|---|---|---|
${pages.join('\n')}

## Portfolio items

| ID | Old URL | Title | New home |
|---|---|---|---|
${portfolio.join('\n')}

## Media library

| ID | Date | Type | File | New home |
|---|---|---|---|---|
${rows.join('\n')}

## Files referenced by the live content but not in the public media library

| File | Used on | New home |
|---|---|---|
${extraRows.join('\n') || '| none | | |'}

## External documents (eumis2020)

| URL | New home |
|---|---|
${eumis.join('\n') || '| none | |'}
`;
}

// ---------- files

function readUrlMap(): UrlMap {
    const empty: UrlMap = { files: {}, pages: {} };
    return existsSync(URL_MAP_FILE) ? { ...empty, ...(JSON.parse(readFileSync(URL_MAP_FILE, 'utf8')) as UrlMap) } : empty;
}

const sortMap = (m: UrlMap): UrlMap => ({
    files: Object.fromEntries(Object.entries(m.files).sort(([a], [b]) => a.localeCompare(b))),
    pages: Object.fromEntries(Object.entries(m.pages).sort(([a], [b]) => a.localeCompare(b)))
});

const writeJson = (path: string, data: unknown) => writeFileIfChanged(path, `${JSON.stringify(data, null, 2)}\n`);
const writeYaml = (path: string, data: unknown) => writeFileIfChanged(path, YAML.stringify(data, { lineWidth: 0 }));

function writeFileIfChanged(path: string, data: string | Buffer) {
    mkdirSync(dirname(path), { recursive: true });
    if (existsSync(path) && Buffer.compare(readFileSync(path), Buffer.from(data)) === 0) return;
    writeFileSync(path, data);
}

main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
});
