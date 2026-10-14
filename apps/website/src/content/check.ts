import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, relative, resolve, sep } from 'node:path';
import { LOCALES } from '@tekom/i18n';
import { splitTurn, TurnError } from '@tekom/ui/turn';
import matter from 'gray-matter';
import YAML from 'yaml';
import { z } from 'zod';
import { EU_PROGRAMMES_FILE, HOME_FILE, LEGAL_DIR, parseLegalFile, PROJECT_FILE, PROJECTS_DIR, PUBLICATIONS_FILE, resolveRef, SETTINGS_FILE } from './paths';
import { EuProgramme, Home, LegalPage, Project, Publication, Settings } from './schema';

export type ContentError = { file: string; path: string; message: string };
export type CheckResult = { ok: true } | { ok: false; errors: ContentError[] };

const WHOLE_FILE = '(file)';

export function checkContent(root: string): CheckResult {
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

    function requireFile(contentFile: string, path: string, ref: string | undefined) {
        if (ref === undefined) return;
        const target = resolveRef(absRoot, contentFile, ref);
        const inside = target.startsWith(absRoot + sep);
        if (!inside || !existsSync(target) || !statSync(target).isFile()) fail(contentFile, path, `file not found: ${ref}`);
    }

    if (!existsSync(absRoot) || !statSync(absRoot).isDirectory()) {
        return { ok: false, errors: [{ file: root, path: WHOLE_FILE, message: 'content folder not found' }] };
    }

    const has = (file: string) => existsSync(join(absRoot, file));

    for (const required of [SETTINGS_FILE, HOME_FILE]) if (!has(required)) fail(required, '', 'required file is missing');

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

    checkProjects();
    const programmeCodes = checkProgrammes();
    checkPublications(programmeCodes);
    checkLegal();

    return errors.length === 0 ? { ok: true } : { ok: false, errors };

    function checkProjects() {
        const dir = join(absRoot, PROJECTS_DIR);
        if (!existsSync(dir)) return;
        const folders = readdirSync(dir, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name)
            .sort();
        const slugOwner = new Map<string, string>(folders.map((f) => [f, f]));
        const oldSlugOwner = new Map<string, string>();
        const wpIds = new Map<number, string>();

        for (const folder of folders) {
            const file = `${PROJECTS_DIR}/${folder}/${PROJECT_FILE}`;
            if (!has(file)) {
                fail(file, '', `missing ${PROJECT_FILE}`);
                continue;
            }
            const project = parse(Project, readYaml(file), file);
            if (!project) continue;

            if (project.slug !== folder) fail(file, 'slug', `slug "${project.slug}" must match its folder "${folder}"`);
            project.old_slugs.forEach((old, i) => {
                const path = `old_slugs.${i}`;
                if (old === project.slug || old === folder) fail(file, path, `"${old}" is the current slug`);
                else if (slugOwner.has(old)) fail(file, path, `"${old}" is the slug of ${PROJECTS_DIR}/${old}`);
                else if (oldSlugOwner.has(old)) fail(file, path, `"${old}" is already an old slug of ${oldSlugOwner.get(old)}`);
                oldSlugOwner.set(old, oldSlugOwner.get(old) ?? folder);
            });
            if (project.wp_id !== undefined) {
                if (wpIds.has(project.wp_id)) fail(file, 'wp_id', `wp_id ${project.wp_id} is already used by ${wpIds.get(project.wp_id)}`);
                wpIds.set(project.wp_id, folder);
            }
            project.images.forEach((image, i) => requireFile(file, `images.${i}.file`, image.file));
            requireFile(file, 'og_image', project.og_image);
        }
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

    function checkLegal() {
        const dir = join(absRoot, LEGAL_DIR);
        if (!existsSync(dir)) return;
        const names = readdirSync(dir).sort();
        const pages = new Set<string>();
        for (const name of names) {
            const file = `${LEGAL_DIR}/${name}`;
            const id = parseLegalFile(name);
            if (!id) {
                fail(file, '', 'name must be <privacy|cookies|data-rights|terms>.<bg|en|de>.md');
                continue;
            }
            pages.add(`${id.slug}.${id.locale}`);
            let front: matter.GrayMatterFile<string>;
            try {
                front = matter(readFileSync(join(dir, name), 'utf8'), { engines: { yaml: (s) => YAML.parse(s) ?? {} } });
            } catch (e) {
                fail(file, '', `cannot read front matter: ${(e as Error).message}`);
                continue;
            }
            parse(LegalPage, { ...front.data, ...id, body: front.content.trim() }, file);
        }
        for (const key of pages) {
            const [slug, locale] = key.split('.');
            if (locale !== 'bg' && !pages.has(`${slug}.bg`)) fail(`${LEGAL_DIR}/${key}.md`, '', `needs the Bulgarian page ${LEGAL_DIR}/${slug}.bg.md`);
        }
    }
}

function main(argv: string[]) {
    const root = resolve(argv[2] ?? join(process.cwd(), '..', '..', 'content'));
    if (!existsSync(root)) {
        console.log(`content:check: no content folder at ${root}, nothing to check`);
        return 0;
    }
    const result = checkContent(root);
    if (result.ok) {
        console.log('content:check: all content files are valid');
        return 0;
    }
    for (const e of result.errors) console.error(`${e.file}: ${e.path} ${e.message}`);
    console.error(`content:check: ${result.errors.length} error${result.errors.length === 1 ? '' : 's'}`);
    return 1;
}

if (process.argv[1] && basename(process.argv[1]) === 'check.ts') process.exitCode = main(process.argv);
