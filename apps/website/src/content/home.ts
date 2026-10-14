import type { Locale } from '@tekom/i18n';
import type { ProjectCard } from './cards';
import { defaultRoot, imgOrNull, loadImg, once, readYaml, text } from './load';
import type { Img } from './load';
import { HOME_FILE } from './paths';
import { listProjects, listRailProjects } from './projects';
import { Home } from './schema';
import { getSettings, type SiteSettings } from './settings';

export type Panel =
    | { kind: 'capability'; afterProjectIndex: number; accent: boolean; label: string; title: string; body: string }
    | { kind: 'crew_stat'; afterProjectIndex: number; statValue: string; unit: string; body: string; unconfirmed: boolean };

export type CrewRoleView = { tool: string; role: string; years: number; quip: string };
export type Crew = { key: 'site' | 'office'; scene: 'site' | 'office'; title: string; body: string; groupPhoto: Img | null; roles: CrewRoleView[] };

export type HomeData = {
    rail: ProjectCard[];
    /** Every published project that has a pin, on the rail or not. */
    map: ProjectCard[];
    panels: Panel[];
    promises: { title: string; body: string }[];
    stats: { value: number | string; label: string; unconfirmed: boolean }[];
    crews: Crew[];
    partnerServices: { icon: string; title: string; body: string }[];
    brands: { name: string; url: string | null; logo: Img }[];
    partners: { name: string; role: string; url: string | null; logo: Img }[];
    settings: SiteSettings;
};

/** `{years}` in a stat value stands for the years since the company was founded, counted at build time. */
export const fillYears = (value: string, founded: number, now = new Date()) => value.replaceAll('{years}', String(now.getFullYear() - founded));

export function getHome(locale: Locale, root: string = defaultRoot()): HomeData {
    const home = once(root, 'home', () => readYaml(root, HOME_FILE, Home));
    const settings = getSettings(locale, root);
    const t = (l: Parameters<typeof text>[0]) => text(l, locale);
    const value = (v: string) => fillYears(v, settings.founded);
    return {
        rail: listRailProjects(locale, root),
        map: listProjects(locale, root).filter((card) => card.pin !== null),
        panels: home.rail_panels.map((p) =>
            p.kind === 'capability'
                ? { kind: p.kind, afterProjectIndex: p.after_project_index, accent: p.accent, label: t(p.label), title: t(p.title), body: t(p.body) }
                : {
                      kind: p.kind,
                      afterProjectIndex: p.after_project_index,
                      statValue: value(p.stat_value),
                      unit: t(p.unit),
                      body: t(p.body),
                      unconfirmed: p.unconfirmed
                  }
        ),
        promises: home.promises.map((p) => ({ title: t(p.title), body: t(p.body) })),
        stats: home.stats.map((s) => ({ value: typeof s.value === 'number' ? s.value : value(s.value), label: t(s.label), unconfirmed: s.unconfirmed })),
        crews: home.crews.map((c) => ({
            key: c.key,
            scene: c.scene,
            title: t(c.title),
            body: t(c.body),
            groupPhoto: imgOrNull(root, HOME_FILE, c.group_photo, t(c.title)),
            roles: c.roles.map((r) => ({ tool: r.tool, role: t(r.role), years: r.years, quip: t(r.quip) }))
        })),
        partnerServices: home.partner_services.map((s) => ({ icon: s.icon, title: t(s.title), body: t(s.body) })),
        brands: home.materials.map((b) => ({ name: b.name, url: b.url ?? null, logo: loadImg(root, HOME_FILE, b.logo, b.name) })),
        partners: home.partners.map((p) => ({ name: p.name, role: t(p.role), url: p.url ?? null, logo: loadImg(root, HOME_FILE, p.logo, p.name) })),
        settings
    };
}
