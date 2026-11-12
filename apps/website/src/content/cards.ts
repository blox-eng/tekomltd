import type { Locale } from '@tekom/i18n';
import { t, text, type Img } from './load';
import type { FOCUS, Project, SCOPES } from './schema';

export type Scope = (typeof SCOPES)[number];
export type Focus = (typeof FOCUS)[number];
export type ProjectImg = Img & { focus: Focus };

export type ProjectCard = {
    slug: string;
    title: string;
    titleFallback: boolean;
    place: string;
    year: number | null;
    areaM2: number | null;
    scopes: Scope[];
    residential: boolean;
    cover: ProjectImg;
    pin: { lat: number; lng: number } | null;
    /** Work goes on now: a `progress` block with `status: in_progress`. */
    inProgress: boolean;
};

export function toProjectCard(project: Project, cover: ProjectImg, locale: Locale): ProjectCard {
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
        residential: project.residential,
        cover,
        pin: hasPin ? { lat: project.lat!, lng: project.lng! } : null,
        inProgress: project.progress?.status === 'in_progress'
    };
}
