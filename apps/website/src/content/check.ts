import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { DEFAULT_LOCALE, LOCALES } from '@tekom/i18n';
import { splitTurn, TurnError } from '@tekom/ui/turn';
import YAML from 'yaml';
import { z } from 'zod';
import { MEDIA_URL, parseFrontMatter } from './load';
import {
    EU_PROGRAMMES_FILE,
    HOME_FILE,
    LEGAL_DIR,
    PAGES_DIR,
    parseLegalFile,
    parsePageFile,
    PROJECT_FILE,
    PROJECTS_DIR,
    PUBLICATIONS_FILE,
    RESERVED_PAGE_SLUGS,
    resolveRef,
    SERVICES_DIR,
    SETTINGS_FILE,
    urlMapFrom
} from './paths';
import { EuProgramme, Home, LegalPage, Page, Project, Publication, Service, Settings } from './schema';

export type ContentError = { file: string; path: string; message: string };
export type CheckResult = { ok: true } | { ok: false; errors: ContentError[] };
export type CheckOptions = { /** url-map.json of the WordPress import: every file it redirects to must still exist. */ urlMap?: string };

const WHOLE_FILE = '(file)';

/** Roughly Bulgaria; a pin outside it is a typo or swapped coordinates. */
const BULGARIA = { lat: [41, 44.5], lng: [22, 29] } as const;

export function checkContent(root: string, options: CheckOptions = {}): CheckResult {
    const absRoot = resolve(root);
    const errors: ContentError[] = [];
    const fail = (file: string, path: string, message: string) => errors.push({ file, path: path || WHOLE_FILE, message });

    const rel = (file: string) => relative(absRoot, file).split(sep).join('/');

    function parse<T extends z.ZodType>(schema: T, data: unknown, file: string): z.infer<T> | undefined {
        const result = schema.safeParse(data);
        if (result.success) return result.data;
        for (const issue of result.error.issues) fail(file, issue.path.join('.'), issue.message);
        return undefined;
    }

    function readYaml(file: string): unknown {
        try {
            return YAML.parse(readFileSync(join(absRoot, file), 'utf8'));
        } catch (e) {
            fail(file, '', `cannot read YAML: ${(e as Error).message}`);
            return undefined;
        }
    }

    const isContentFile = (target: string) => target.startsWith(absRoot + sep) && existsSync(target) && statSync(target).isFile();

    function requireFile(contentFile: string, path: string, ref: string | undefined) {
        if (ref === undefined) return;
        if (!isContentFile(resolveRef(absRoot, contentFile, ref))) fail(contentFile, path, `file not found: ${ref}`);
    }

    if (!existsSync(absRoot) || !statSync(absRoot).isDirectory()) {
        return { ok: false, errors: [{ file: root, path: WHOLE_FILE, message: 'content folder not found' }] };
    }

    const has = (file: string) => existsSync(join(absRoot, file));

    for (const required of [SETTINGS_FILE, HOME_FILE, EU_PROGRAMMES_FILE, PUBLICATIONS_FILE])
        if (!has(required)) fail(required, '', 'required file is missing');

    if (has(SETTINGS_FILE)) {
        const settings = parse(Settings, readYaml(SETTINGS_FILE), SETTINGS_FILE);
        if (settings) {
            requireFile(SETTINGS_FILE, 'og_image', settings.og_image);
            for (const locale of LOCALES) {
                const list = settings.crew_headline[locale];
                if (!list) continue;
                try {
                    splitTurn(list);
                } catch (e) {
                    if (!(e instanceof TurnError)) throw e;
                    fail(SETTINGS_FILE, `crew_headline.${locale}`, `${e.message}: ${list.map((p) => `"${p}"`).join(', ')}`);
                }
            }
        }
    }

    if (has(HOME_FILE)) {
        const home = parse(Home, readYaml(HOME_FILE), HOME_FILE);
        if (home) {
            const seen = new Set<string>();
            home.crews.forEach((crew, i) => {
                if (seen.has(crew.key)) fail(HOME_FILE, `crews.${i}.key`, `duplicate crew "${crew.key}"`);
                seen.add(crew.key);
                requireFile(HOME_FILE, `crews.${i}.group_photo`, crew.group_photo);
            });
            home.materials.forEach((m, i) => requireFile(HOME_FILE, `materials.${i}.logo`, m.logo));
            home.partners.forEach((p, i) => requireFile(HOME_FILE, `partners.${i}.logo`, p.logo));
        }
    }

    const projects = checkProjects();
    const programmeCodes = checkProgrammes();
    checkPublications(programmeCodes);
    checkMarkdown(LEGAL_DIR, parseLegalFile, LegalPage, '<privacy|cookies|data-rights|terms>.<bg|en|de>.md');
    const serviceSlugs = checkServices(projects);
    checkMarkdown(PAGES_DIR, parsePageFile, Page, '<slug>.<bg|en|de>.md', [...RESERVED_PAGE_SLUGS, ...serviceSlugs]);
    if (options.urlMap) checkUrlMap(options.urlMap);

    return errors.length === 0 ? { ok: true } : { ok: false, errors };

    /** Valid projects that are not drafts, for the service pages that list them. */
    function checkProjects(): Project[] {
        const published: Project[] = [];
        const dir = join(absRoot, PROJECTS_DIR);
        if (!existsSync(dir)) return published;
        const folders = readdirSync(dir, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name)
            .sort();
        const slugOwner = new Map<string, string>(folders.map((f) => [f, f]));
        const oldSlugOwner = new Map<string, string>();
        const wpIds = new Map<number, string>();
        const wpSlugs = new Map<string, string>();
        const takenBy = (owner: string) => `is already used by ${PROJECTS_DIR}/${owner} — delete this line in a new project`;

        for (const folder of folders) {
            const file = `${PROJECTS_DIR}/${folder}/${PROJECT_FILE}`;
            if (!has(file)) {
                fail(file, '', `missing ${PROJECT_FILE}`);
                continue;
            }
            const project = parse(Project, readYaml(file), file);
            if (!project) continue;
            if (!project.draft) published.push(project);

            if (project.slug !== folder) fail(file, 'slug', `slug "${project.slug}" must match its folder "${folder}"`);
            project.old_slugs.forEach((old, i) => {
                const path = `old_slugs.${i}`;
                if (old === project.slug || old === folder) fail(file, path, `"${old}" is the current slug`);
                else if (slugOwner.has(old)) fail(file, path, `"${old}" is the slug of ${PROJECTS_DIR}/${old}`);
                else if (oldSlugOwner.has(old)) fail(file, path, `"${old}" is already an old slug of ${oldSlugOwner.get(old)}`);
                oldSlugOwner.set(old, oldSlugOwner.get(old) ?? folder);
            });
            if (project.wp_id !== undefined) {
                const owner = wpIds.get(project.wp_id);
                if (owner) fail(file, 'wp_id', `wp_id ${project.wp_id} ${takenBy(owner)}`);
                else wpIds.set(project.wp_id, folder);
            }
            if (project.wp_slug !== undefined) {
                const owner = wpSlugs.get(project.wp_slug);
                if (owner) fail(file, 'wp_slug', `wp_slug "${project.wp_slug}" ${takenBy(owner)}`);
                else wpSlugs.set(project.wp_slug, folder);
            }
            const { lat, lng } = project;
            if (lat !== undefined && lng !== undefined && (lat < BULGARIA.lat[0] || lat > BULGARIA.lat[1] || lng < BULGARIA.lng[0] || lng > BULGARIA.lng[1])) {
                fail(
                    file,
                    'lat',
                    `lat ${lat}, lng ${lng} is outside Bulgaria (lat 41–44.5, lng 22–29); check the numbers and that lat and lng are not swapped`
                );
            }
            if (!project.draft && project.images.length === 0) fail(file, 'images', 'project has no photos; add at least one image or set draft: true');
            project.images.forEach((image, i) => requireFile(file, `images.${i}.file`, image.file));
            requireFile(file, 'og_image', project.og_image);
        }
        return published;
    }

    /** `services/<slug>.yaml`; returns the slugs, which no page may take. */
    function checkServices(projects: Project[]): string[] {
        const dir = join(absRoot, SERVICES_DIR);
        if (!existsSync(dir)) return [];
        const pageSlugs = existsSync(join(absRoot, PAGES_DIR)) ? readdirSync(join(absRoot, PAGES_DIR)).flatMap((name) => parsePageFile(name)?.slug ?? []) : [];
        const slugs: string[] = [];
        const oldPathOwner = new Map<string, string>();
        const services: { file: string; service: Service }[] = [];
        for (const name of readdirSync(dir).sort()) {
            const file = `${SERVICES_DIR}/${name}`;
            if (!name.endsWith('.yaml')) {
                fail(file, '', 'name must be <slug>.yaml');
                continue;
            }
            const service = parse(Service, readYaml(file), file);
            if (!service) continue;
            slugs.push(service.slug);
            services.push({ file, service });
            if (`${service.slug}.yaml` !== name) fail(file, 'slug', `slug "${service.slug}" must match the file name "${name}"`);
            if (RESERVED_PAGE_SLUGS.includes(service.slug) || pageSlugs.includes(service.slug))
                fail(file, 'slug', `"${service.slug}" is already an address of the site; give the service another slug`);
            const { scope, residential } = service.projects;
            const matching = projects.filter((p) => p.scopes.includes(scope) && (residential === undefined || p.residential === residential));
            if (matching.length === 0)
                fail(file, 'projects', `no published project has scope "${scope}"${residential === undefined ? '' : ` and residential: ${residential}`}`);
            if (service.cover_project !== undefined && !matching.some((p) => p.slug === service.cover_project))
                fail(file, 'cover_project', `"${service.cover_project}" is not one of the projects this page shows`);
            service.old_paths.forEach((old, i) => {
                const owner = oldPathOwner.get(old);
                if (owner) fail(file, `old_paths.${i}`, `"${old}" already leads to ${owner}`);
                oldPathOwner.set(old, owner ?? service.slug);
            });
        }
        // An old path must not be an address that still answers, or the redirect would hide a live page.
        const live = new Set([...RESERVED_PAGE_SLUGS, ...pageSlugs, ...slugs].map((s) => `/${s}`));
        for (const { file, service } of services)
            service.old_paths.forEach((old, i) => {
                if (live.has(old)) fail(file, `old_paths.${i}`, `"${old}" is a live page of the site; delete that page first`);
            });
        return slugs;
    }

    function checkProgrammes(): Set<string> {
        const codes = new Set<string>();
        if (!has(EU_PROGRAMMES_FILE)) return codes;
        const list = parse(z.array(EuProgramme), readYaml(EU_PROGRAMMES_FILE), EU_PROGRAMMES_FILE);
        list?.forEach((programme, i) => {
            if (codes.has(programme.code)) fail(EU_PROGRAMMES_FILE, `${i}.code`, `duplicate programme code "${programme.code}"`);
            codes.add(programme.code);
            requireFile(EU_PROGRAMMES_FILE, `${i}.programme_logo`, programme.programme_logo);
            if (programme.period_start && programme.period_end && programme.period_end < programme.period_start) {
                fail(EU_PROGRAMMES_FILE, `${i}.period_end`, 'the period ends before it starts');
            }
        });
        return codes;
    }

    function checkPublications(codes: Set<string>) {
        if (!has(PUBLICATIONS_FILE)) return;
        const list = parse(z.array(Publication), readYaml(PUBLICATIONS_FILE), PUBLICATIONS_FILE);
        list?.forEach((publication, i) => {
            if (publication.programme !== undefined && !codes.has(publication.programme)) {
                fail(PUBLICATIONS_FILE, `${i}.programme`, `no programme with code "${publication.programme}" in ${EU_PROGRAMMES_FILE}`);
            }
            requireFile(PUBLICATIONS_FILE, `${i}.file`, publication.file);
        });
    }

    /** A folder of `<slug>.<locale>.md` files; every `/media/…` link in a body must point at a content file, and every image must be one. */
    function checkMarkdown(
        folder: string,
        parseName: (name: string) => { slug: string; locale: string } | null,
        schema: z.ZodType,
        pattern: string,
        reserved: readonly string[] = []
    ) {
        const dir = join(absRoot, folder);
        if (!existsSync(dir)) return;
        const pages = new Set<string>();
        for (const name of readdirSync(dir).sort()) {
            if (statSync(join(dir, name)).isDirectory()) continue;
            const file = `${folder}/${name}`;
            const id = parseName(name);
            if (!id) {
                fail(file, '', `name must be ${pattern}`);
                continue;
            }
            pages.add(`${id.slug}.${id.locale}`);
            if (reserved.includes(id.slug)) fail(file, '', `"${id.slug}" is already an address of the site; give the page another name`);
            let front: ReturnType<typeof parseFrontMatter>;
            try {
                front = parseFrontMatter(readFileSync(join(dir, name), 'utf8'));
            } catch (e) {
                fail(file, '', `cannot read front matter: ${(e as Error).message}`);
                continue;
            }
            parse(schema, { ...front.data, ...id, body: front.body }, file);
            for (const src of imageSources(front.body)) {
                if (!src.startsWith(`${MEDIA_URL}/`))
                    fail(file, 'body', `image must be a file under ${MEDIA_URL}/: ${src} (the site loads nothing from other sites)`);
            }
            for (const link of mediaLinks(front.body)) {
                let ref: string;
                try {
                    ref = decodeURI(link.slice(MEDIA_URL.length + 1));
                } catch {
                    fail(file, 'body', `broken link: ${link} (a % sign must be followed by two hex digits; rename the file without %)`);
                    continue;
                }
                if (!isContentFile(resolve(absRoot, ref))) fail(file, 'body', `file not found: ${link}`);
            }
        }
        for (const key of pages) {
            const [slug, locale] = key.split('.');
            if (locale !== DEFAULT_LOCALE && !pages.has(`${slug}.${DEFAULT_LOCALE}`))
                fail(`${folder}/${key}.md`, '', `needs the Bulgarian page ${folder}/${slug}.${DEFAULT_LOCALE}.md`);
        }
    }

    function checkUrlMap(urlMap: string) {
        const name = relative(dirname(absRoot), urlMap).split(sep).join('/');
        const files: Record<string, string> = JSON.parse(readFileSync(urlMap, 'utf8')).files ?? {};
        for (const [from, to] of Object.entries(files)) {
            const ref = to.startsWith(`${MEDIA_URL}/`) ? to.slice(MEDIA_URL.length + 1) : to;
            if (!isContentFile(resolve(absRoot, ref))) {
                fail(
                    ref,
                    '',
                    `file not found: the old address ${from} leads here (${name}); put the file back under this name, or ask a developer to change the redirect`
                );
            }
        }
    }
}

/** Markdown link and image targets that start with the media URL. */
const mediaLinks = (markdown: string) => [...markdown.matchAll(/\]\((\/media\/[^)\s]+)/g)].map((m) => m[1]!);

/** Targets of Markdown images, inline `![a](src)` and by reference `![a][ref]` / `![ref]` with `[ref]: src`. */
function imageSources(markdown: string): string[] {
    const definitions = new Map([...markdown.matchAll(/^ {0,3}\[([^\]]+)\]:\s*<?([^\s>]+)>?/gm)].map((m) => [m[1]!.toLowerCase(), m[2]!]));
    const inline = [...markdown.matchAll(/!\[[^\]]*\]\(\s*<?([^)\s>]+)/g)].map((m) => m[1]!);
    const byReference = [...markdown.matchAll(/!\[([^\]]*)\](?:\[([^\]]*)\])?(?!\()/g)]
        .map((m) => definitions.get((m[2] || m[1]!).toLowerCase()))
        .filter((src): src is string => src !== undefined);
    return [...inline, ...byReference];
}

export function main(argv: string[]) {
    const repoRoot = join(process.cwd(), '..', '..');
    const root = resolve(argv[2] ?? join(repoRoot, 'content'));
    // The url-map belongs to the repo's own content; a fixture tree passed as an argument has none.
    const urlMap = argv[2] === undefined && existsSync(urlMapFrom(repoRoot)) ? urlMapFrom(repoRoot) : undefined;
    const result = checkContent(root, { urlMap });
    if (result.ok) {
        console.log('content:check: all content files are valid');
        return 0;
    }
    for (const e of result.errors) console.error(`${e.file}: ${e.path} ${e.message}`);
    console.error(`content:check: ${result.errors.length} error${result.errors.length === 1 ? '' : 's'}`);
    return 1;
}

if (process.argv[1] && basename(process.argv[1]) === 'check.ts') process.exitCode = main(process.argv);
