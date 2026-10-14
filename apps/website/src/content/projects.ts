import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Locale } from '@tekom/i18n';
import { toProjectCard, type ProjectCard, type ProjectImg } from './cards';
import { defaultRoot, imgOrNull, loadImg, once, readYaml, t, text, textOrNull, type Img } from './load';
import { PROJECTS_DIR, projectFile } from './paths';
import { Project } from './schema';

type Loaded = { project: Project; file: string };

export type ProjectDetail = ProjectCard & {
    address: string | null;
    summary: string | null;
    summaryFallback: boolean;
    images: ProjectImg[];
    position: number;
    total: number;
    next: { slug: string; title: string };
    metaTitle: string | null;
    metaDescription: string | null;
    ogImage: Img | null;
};

const bySort = (a: Project, b: Project) => (a.sort ?? Infinity) - (b.sort ?? Infinity) || (b.year ?? 0) - (a.year ?? 0) || a.slug.localeCompare(b.slug);

/** Published projects in display order. Drafts never leave this function. */
function loadProjects(root: string): Loaded[] {
    return once(root, 'projects', () => {
        const folders = readdirSync(join(root, PROJECTS_DIR), { withFileTypes: true }).filter((d) => d.isDirectory());
        return folders
            .map((d) => ({ file: projectFile(d.name), project: readYaml(root, projectFile(d.name), Project) }))
            .filter(({ project }) => !project.draft)
            .sort((a, b) => bySort(a.project, b.project))
            .map((loaded) => {
                if (loaded.project.images.length === 0) throw new Error(`content: ${loaded.file} needs at least one image`);
                return loaded;
            });
    });
}

function images({ project, file }: Loaded, root: string, locale: Locale): ProjectImg[] {
    return project.images.map((i) => ({ ...loadImg(root, file, i.file, text(i.alt ?? project.title, locale)), focus: i.focus }));
}

function coverOf(loaded: Loaded, root: string, locale: Locale): ProjectImg {
    const index = Math.max(
        0,
        loaded.project.images.findIndex((i) => i.is_cover)
    );
    return images(loaded, root, locale)[index]!;
}

const card = (loaded: Loaded, root: string, locale: Locale) => toProjectCard(loaded.project, coverOf(loaded, root, locale), locale);

export function listProjects(locale: Locale, root: string = defaultRoot()): ProjectCard[] {
    return loadProjects(root).map((p) => card(p, root, locale));
}

export function listRailProjects(locale: Locale, root: string = defaultRoot()): ProjectCard[] {
    return loadProjects(root)
        .filter((p) => p.project.on_rail)
        .map((p) => card(p, root, locale));
}

export function getProject(slug: string, locale: Locale, root: string = defaultRoot()): ProjectDetail | null {
    const all = loadProjects(root);
    const index = all.findIndex((p) => p.project.slug === slug);
    if (index < 0) return null;
    const loaded = all[index]!;
    const { project, file } = loaded;
    const nextProject = all[(index + 1) % all.length]!.project;
    const summary = project.summary ? t(project.summary, locale) : null;
    const base = card(loaded, root, locale);
    return {
        ...base,
        address: project.address ?? null,
        summary: summary?.text ?? null,
        summaryFallback: summary?.fallback ?? false,
        images: images(loaded, root, locale),
        position: index + 1,
        total: all.length,
        next: { slug: nextProject.slug, title: text(nextProject.title, locale) },
        metaTitle: textOrNull(project.meta_title, locale),
        metaDescription: textOrNull(project.meta_description, locale),
        ogImage: imgOrNull(root, file, project.og_image, base.title)
    };
}

export function allProjectSlugs(root: string = defaultRoot()) {
    return loadProjects(root).map(({ project: p }) => ({ slug: p.slug, wpSlug: p.wp_slug ?? null, wpId: p.wp_id ?? null, oldSlugs: p.old_slugs }));
}
