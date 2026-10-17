import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { LOCALES, type Locale } from '@tekom/i18n';
import type { ProjectCard } from './cards';
import { defaultRoot, once, readYaml, text } from './load';
import { SERVICES_DIR, serviceFile } from './paths';
import { listProjectsMatching, matchesFilter } from './projects';
import { Service, type L } from './schema';

type Item = { title: string; body: string };

export type ServiceLink = { slug: string; name: string; blurb: string };

export type ServiceDetail = ServiceLink & {
    metaTitle: string;
    metaDescription: string;
    h1: string;
    intro: string;
    benefits: Item[];
    explainers: Item[];
    stepsTitle: string;
    steps: Item[];
    materialsTitle: string;
    materials: string;
    projectsTitle: string;
    projects: ProjectCard[];
    cover: ProjectCard;
    faq: { q: string; a: string }[];
    cta: { title: string; body: string; button: string };
};

function loadServices(root: string): Service[] {
    return once(root, 'services', () => {
        const dir = join(root, SERVICES_DIR);
        if (!existsSync(dir)) return [];
        return readdirSync(dir)
            .filter((name) => name.endsWith('.yaml'))
            .sort()
            .map((name) => readYaml(root, join(SERVICES_DIR, name), Service));
    });
}

/** A service has a page in a locale only once its heading is written in that locale: no Bulgarian stand-ins. */
export const serviceLocales = (service: Pick<Service, 'h1'>): Locale[] => LOCALES.filter((l) => Boolean(service.h1[l]));

const published = (locale: Locale, root: string) => loadServices(root).filter((s) => serviceLocales(s).includes(locale));

const link = (s: Service, locale: Locale): ServiceLink => ({ slug: s.slug, name: text(s.name, locale), blurb: text(s.nav_blurb, locale) });

const items = (list: { title: L; body: L }[], locale: Locale): Item[] => list.map((i) => ({ title: text(i.title, locale), body: text(i.body, locale) }));

export function listServices(locale: Locale, root: string = defaultRoot()): ServiceLink[] {
    return published(locale, root).map((s) => link(s, locale));
}

export function getService(slug: string, locale: Locale, root: string = defaultRoot()): ServiceDetail | null {
    const service = published(locale, root).find((s) => s.slug === slug);
    if (!service) return null;
    const projects = listProjectsMatching(service.projects, locale, root);
    const cover = projects.find((p) => p.slug === service.cover_project) ?? projects[0];
    if (!cover) throw new Error(`content: ${serviceFile(slug)} matches no published project`);
    return {
        ...link(service, locale),
        metaTitle: text(service.meta_title, locale),
        metaDescription: text(service.meta_description, locale),
        h1: text(service.h1, locale),
        intro: text(service.intro, locale),
        benefits: items(service.benefits, locale),
        explainers: items(service.explainers, locale),
        stepsTitle: text(service.steps_title, locale),
        steps: items(service.steps, locale),
        materialsTitle: text(service.materials_title, locale),
        materials: text(service.materials, locale),
        projectsTitle: text(service.projects_title, locale),
        projects,
        cover,
        faq: service.faq.map((f) => ({ q: text(f.q, locale), a: text(f.a, locale) })),
        cta: { title: text(service.cta.title, locale), body: text(service.cta.body, locale), button: text(service.cta.button, locale) }
    };
}

/** The services whose page lists this project, for the link back from the project page. */
export function servicesOfProject(project: Pick<ProjectCard, 'scopes' | 'residential'>, locale: Locale, root: string = defaultRoot()): ServiceLink[] {
    return published(locale, root)
        .filter((s) => matchesFilter(project, s.projects))
        .map((s) => link(s, locale));
}

export function allServiceSlugs(root: string = defaultRoot()): { slug: string; locales: Locale[]; oldPaths: string[] }[] {
    return loadServices(root).map((s) => ({ slug: s.slug, locales: serviceLocales(s), oldPaths: s.old_paths }));
}
