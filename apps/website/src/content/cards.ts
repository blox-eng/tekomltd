import type { Locale } from '@tekom/i18n';
import { t, text, type Img } from './load';
import type { Project, SCOPES } from './schema';

export type Scope = (typeof SCOPES)[number];

export type ProjectCard = {
    slug: string;
    title: string;
    titleFallback: boolean;
    place: string;
    year: number | null;
    areaM2: number | null;
    scopes: Scope[];
    cover: Img;
    wide: boolean;
    pin: { lat: number; lng: number } | null;
};

export function toProjectCard(project: Project, cover: Img, locale: Locale): ProjectCard {
    const title = t(project.title, locale);
    const hasPin = project.show_on_map && project.lat !== undefined && project.lng !== undefined;
    return {
        slug: project.slug,
        title: title.text,
        titleFallback: title.fallback,
        place: text(project.place, locale),
        year: project.year ?? null,
        areaM2: project.built_area_m2 ?? null,
        scopes: project.scopes,
        cover,
        wide: project.wide,
        pin: hasPin ? { lat: project.lat!, lng: project.lng! } : null
    };
}
