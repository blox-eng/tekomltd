import { LOCALES } from '@tekom/i18n';
import { CREW_GLYPH_KEYS, SERVICE_GLYPH_KEYS } from '@tekom/ui/glyphs';
import { z } from 'zod';
import { LEGAL_SLUGS } from './paths';

export const SCOPES = ['full', 'restore', 'facade', 'interior', 'stone'] as const;
export const SUMMARY_MAX = 460;

const text = z.string().trim().min(1);

/** Localised text: Bulgarian is required, English and German are optional. */
export const L = z.strictObject({ bg: text, en: z.string().optional(), de: z.string().optional() });

const Summary = z.strictObject({
    bg: text.max(SUMMARY_MAX),
    en: z.string().max(SUMMARY_MAX).optional(),
    de: z.string().max(SUMMARY_MAX).optional()
});

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'use lowercase letters, digits and single hyphens');

/** A path relative to the content file that holds it. It cannot be absolute or leave the content folder. */
const filePath = (extensions: readonly string[]) =>
    z
        .string()
        .refine(
            (p) => !p.startsWith('/') && !p.includes('\\') && !/^[a-z]:/i.test(p) && !p.split('/').includes('..'),
            'must be a relative path inside the content folder'
        )
        .refine((p) => extensions.some((e) => p.toLowerCase().endsWith(`.${e}`)), `must end in .${extensions.join(', .')}`);

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
const imagePath = filePath(IMAGE_EXTENSIONS);
const logoPath = filePath(['png', 'svg']);
const documentPath = filePath(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg']);

const url = z.url({ protocol: /^https?$/ });

export const ProjectImage = z.strictObject({
    file: imagePath,
    alt: L.optional(),
    is_cover: z.boolean().default(false)
});

export const Project = z
    .strictObject({
        slug,
        title: L,
        summary: Summary.optional(),
        place: L,
        address: z.string().trim().min(1).optional(),
        lat: z.number().min(-90).max(90).optional(),
        lng: z.number().min(-180).max(180).optional(),
        show_on_map: z.boolean().default(false),
        year: z.number().int().min(1900).max(2100).optional(),
        built_area_m2: z.number().positive().optional(),
        scopes: z.array(z.enum(SCOPES)).default([]),
        sort: z.number().int().optional(),
        wide: z.boolean().default(false),
        on_rail: z.boolean().default(false),
        wp_id: z.number().int().positive().optional(),
        wp_slug: z.string().min(1).optional(),
        old_slugs: z.array(slug).default([]),
        draft: z.boolean().default(false),
        meta_title: L.optional(),
        meta_description: L.optional(),
        og_image: imagePath.optional(),
        images: z.array(ProjectImage).default([])
    })
    .refine((p) => (p.lat === undefined) === (p.lng === undefined), { message: 'lat and lng go together', path: ['lat'] })
    .refine((p) => p.images.filter((i) => i.is_cover).length <= 1, { message: 'only one image can be the cover', path: ['images'] });

const capabilityPanel = z.strictObject({
    kind: z.literal('capability'),
    after_project_index: z.number().int().min(0),
    accent: z.boolean().default(false),
    label: L,
    title: L,
    body: L
});

const crewStatPanel = z.strictObject({
    kind: z.literal('crew_stat'),
    after_project_index: z.number().int().min(0),
    stat_value: text,
    unit: L,
    body: L,
    unconfirmed: z.boolean().default(false)
});

export const RailPanel = z.discriminatedUnion('kind', [capabilityPanel, crewStatPanel]);

export const PromiseItem = z.strictObject({ title: L, body: L });

/** A number the renderer formats per locale, or text such as `{years}` (years since `founded`). */
export const Stat = z.strictObject({ value: z.union([z.number(), text]), label: L, unconfirmed: z.boolean().default(false) });

export const CrewRole = z.strictObject({
    tool: z.enum(CREW_GLYPH_KEYS),
    role: L,
    years: z.number().int().min(0),
    quip: L
});

export const Crew = z.strictObject({
    key: z.enum(['site', 'office']),
    scene: z.enum(['site', 'office']),
    title: L,
    body: L,
    group_photo: imagePath.optional(),
    roles: z.array(CrewRole).default([])
});

export const PartnerService = z.strictObject({ icon: z.enum(SERVICE_GLYPH_KEYS), title: L, body: L });

export const Partner = z.strictObject({ name: text, role: L, logo: logoPath, url: url.optional() });

export const MaterialBrand = z.strictObject({ name: text, logo: logoPath, url: url.optional() });

export const Home = z
    .strictObject({
        rail_panels: z.array(RailPanel).default([]),
        promises: z.array(PromiseItem).default([]),
        stats: z.array(Stat).default([]),
        crews: z.array(Crew).default([]),
        partner_services: z.array(PartnerService).default([]),
        materials: z.array(MaterialBrand).default([]),
        partners: z.array(Partner).default([])
    })
    .refine((h) => h.rail_panels.filter((p) => p.kind === 'capability' && p.accent).length <= 1, {
        message: 'only one rail panel can be the red one',
        path: ['rail_panels']
    });

export const EuProgramme = z.strictObject({
    code: text,
    title: L,
    summary: L,
    objectives: L,
    results: L,
    total_budget_eur: z.number().nonnegative().optional(),
    eu_contribution_eur: z.number().nonnegative().optional(),
    period_start: z.iso.date().optional(),
    period_end: z.iso.date().optional(),
    programme_logo: logoPath.optional()
});

export const PUBLICATION_KINDS = ['eu_notice', 'procurement', 'other'] as const;

export const Publication = z.strictObject({
    programme: text.optional(),
    kind: z.enum(PUBLICATION_KINDS),
    title: L,
    file: documentPath,
    published_on: z.iso.date(),
    wp_url: url.optional()
});

export const LegalPage = z.strictObject({
    slug: z.enum(LEGAL_SLUGS),
    locale: z.enum(LOCALES),
    title: text,
    updated: z.iso.date(),
    reviewed: z.boolean(),
    body: text
});

/** A page carried over from the WordPress site; `wp_url` is its old address, for the redirect. */
export const Page = z.strictObject({
    slug,
    locale: z.enum(LOCALES),
    title: text,
    updated: z.iso.date(),
    wp_url: url.optional(),
    body: text
});

const phrases = z.array(text).min(2);

export const Settings = z.strictObject({
    legal_name: text,
    founded: z.number().int().min(1900).max(2100),
    eik: z.string().min(1).optional(),
    vat: z.string().min(1).optional(),
    address: L,
    phone: text,
    phone_alt: text.optional(),
    hours: L.optional(),
    email: z.email(),
    privacy_email: z.email(),
    socials: z.strictObject({ linkedin: url.optional(), instagram: url.optional(), facebook: url.optional() }).default({}),
    crew_headline: z.strictObject({ bg: phrases, en: phrases.optional(), de: phrases.optional() }),
    quote_cta: z.boolean().default(true),
    meta_title: L.optional(),
    meta_description: L.optional(),
    /** Descriptions for pages that have no text of their own to take one from. */
    page_descriptions: z.strictObject({ projects: L.optional(), publications: L.optional() }).default({}),
    og_image: imagePath.optional()
});

export type L = z.infer<typeof L>;
export type ProjectImage = z.infer<typeof ProjectImage>;
export type Project = z.infer<typeof Project>;
export type RailPanel = z.infer<typeof RailPanel>;
export type PromiseItem = z.infer<typeof PromiseItem>;
export type Stat = z.infer<typeof Stat>;
export type Crew = z.infer<typeof Crew>;
export type CrewRole = z.infer<typeof CrewRole>;
export type PartnerService = z.infer<typeof PartnerService>;
export type Partner = z.infer<typeof Partner>;
export type MaterialBrand = z.infer<typeof MaterialBrand>;
export type Home = z.infer<typeof Home>;
export type EuProgramme = z.infer<typeof EuProgramme>;
export type Publication = z.infer<typeof Publication>;
export type LegalPage = z.infer<typeof LegalPage>;
export type Page = z.infer<typeof Page>;
export type Settings = z.infer<typeof Settings>;

// `Promise` is the name the plan uses; the alias avoids shadowing the global inside this module.
export { PromiseItem as Promise };
