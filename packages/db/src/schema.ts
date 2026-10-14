import { sql } from 'drizzle-orm';
import { boolean, check, date, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const SCOPES = ['full', 'restore', 'facade', 'interior', 'stone'] as const;
export const CREW_TOOLS = ['plumb', 'trowel', 'boards', 'roller', 'tiles', 'spatula', 'hat', 'brick', 'truss', 'key', 'ledger', 'square', 'laptop'] as const;
export const SERVICE_ICONS = ['blueprint', 'square', 'beam', 'permit', 'survey', 'bolt', 'drop', 'air', 'window', 'kitchen', 'leaf', 'solar', 'tree'] as const;
export const LEGAL_SLUGS = ['privacy', 'cookies', 'data-rights', 'terms'] as const;
export const ENQUIRY_LOCALES = ['bg', 'en', 'de'] as const;

export const scope = pgEnum('scope', SCOPES);
export const panelKind = pgEnum('panel_kind', ['capability', 'crew_stat']);
export const crewKey = pgEnum('crew_key', ['site', 'office']);
export const scene = pgEnum('scene', ['site', 'office']);
export const publicationKind = pgEnum('publication_kind', ['eu_notice', 'procurement', 'other']);

export type Scope = (typeof SCOPES)[number];
export type CrewTool = (typeof CREW_TOOLS)[number];
export type ServiceIcon = (typeof SERVICE_ICONS)[number];
export type LegalSlug = (typeof LEGAL_SLUGS)[number];
export type Socials = { linkedin?: string; instagram?: string; facebook?: string };

const sqlList = (values: readonly string[]) => sql.raw(values.map((v) => `'${v}'`).join(', '));

const id = () => uuid('id').primaryKey().defaultRandom();
const sort = () => integer('sort').notNull().default(0);
const timestamps = () => ({
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow()
});
const content = () => ({ published: boolean('published').notNull().default(false), ...timestamps() });

export const projects = pgTable(
    'projects',
    {
        id: id(),
        slug: text('slug').notNull().unique(),
        titleBg: text('title_bg').notNull(),
        titleEn: text('title_en'),
        titleDe: text('title_de'),
        summaryBg: text('summary_bg').notNull(),
        summaryEn: text('summary_en'),
        summaryDe: text('summary_de'),
        placeBg: text('place_bg').notNull(),
        placeEn: text('place_en'),
        placeDe: text('place_de'),
        address: text('address'),
        lat: numeric('lat', { mode: 'number' }),
        lng: numeric('lng', { mode: 'number' }),
        showOnMap: boolean('show_on_map').notNull().default(true),
        year: integer('year'),
        builtAreaM2: numeric('built_area_m2', { mode: 'number' }),
        scopes: scope('scopes')
            .array()
            .notNull()
            .default(sql`'{}'`),
        wide: boolean('wide').notNull().default(false),
        onRail: boolean('on_rail').notNull().default(false),
        wpId: integer('wp_id').unique(),
        wpSlug: text('wp_slug').unique(),
        metaTitleBg: text('meta_title_bg'),
        metaTitleEn: text('meta_title_en'),
        metaTitleDe: text('meta_title_de'),
        metaDescriptionBg: text('meta_description_bg'),
        metaDescriptionEn: text('meta_description_en'),
        metaDescriptionDe: text('meta_description_de'),
        ogImagePath: text('og_image_path'),
        sort: sort(),
        ...content()
    },
    (t) => [
        check('projects_slug_format', sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
        check('projects_summary_length', sql`char_length(${t.summaryBg}) <= 420 and char_length(${t.summaryEn}) <= 420 and char_length(${t.summaryDe}) <= 420`),
        check('projects_lat_lng_together', sql`(${t.lat} is null) = (${t.lng} is null)`),
        check('projects_lat_range', sql`${t.lat} between -90 and 90`),
        check('projects_lng_range', sql`${t.lng} between -180 and 180`),
        check('projects_year_range', sql`${t.year} between 1800 and 2200`),
        check('projects_built_area_positive', sql`${t.builtAreaM2} > 0`)
    ]
);

export const projectSlugHistory = pgTable('project_slug_history', {
    id: id(),
    projectId: uuid('project_id')
        .notNull()
        .references(() => projects.id, { onDelete: 'cascade' }),
    oldSlug: text('old_slug').notNull().unique(),
    ...timestamps()
});

export const projectImages = pgTable(
    'project_images',
    {
        id: id(),
        projectId: uuid('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        storagePath: text('storage_path').notNull().unique(),
        width: integer('width').notNull(),
        height: integer('height').notNull(),
        altBg: text('alt_bg').notNull(),
        altEn: text('alt_en'),
        altDe: text('alt_de'),
        isCover: boolean('is_cover').notNull().default(false),
        sort: sort(),
        ...timestamps()
    },
    (t) => [
        uniqueIndex('project_images_one_cover')
            .on(t.projectId)
            .where(sql`${t.isCover}`),
        check('project_images_size_positive', sql`${t.width} > 0 and ${t.height} > 0`)
    ]
);

export const railPanels = pgTable(
    'rail_panels',
    {
        id: id(),
        kind: panelKind('kind').notNull(),
        labelBg: text('label_bg').notNull(),
        labelEn: text('label_en'),
        labelDe: text('label_de'),
        titleBg: text('title_bg'),
        titleEn: text('title_en'),
        titleDe: text('title_de'),
        bodyBg: text('body_bg').notNull(),
        bodyEn: text('body_en'),
        bodyDe: text('body_de'),
        statValue: text('stat_value'),
        accent: boolean('accent').notNull().default(false),
        afterProjectIndex: integer('after_project_index').notNull().default(0),
        sort: sort(),
        ...content()
    },
    (t) => [
        uniqueIndex('rail_panels_one_accent')
            .on(t.accent)
            .where(sql`${t.accent}`),
        check('rail_panels_capability_title', sql`${t.kind} <> 'capability' or ${t.titleBg} is not null`),
        check('rail_panels_crew_stat_value', sql`${t.kind} <> 'crew_stat' or ${t.statValue} is not null`),
        check('rail_panels_after_project_index', sql`${t.afterProjectIndex} >= 0`)
    ]
);

export const promises = pgTable('promises', {
    id: id(),
    titleBg: text('title_bg').notNull(),
    titleEn: text('title_en'),
    titleDe: text('title_de'),
    bodyBg: text('body_bg').notNull(),
    bodyEn: text('body_en'),
    bodyDe: text('body_de'),
    sort: sort(),
    ...content()
});

export const stats = pgTable('stats', {
    id: id(),
    value: text('value').notNull(),
    labelBg: text('label_bg').notNull(),
    labelEn: text('label_en'),
    labelDe: text('label_de'),
    unconfirmed: boolean('unconfirmed').notNull().default(true),
    sort: sort(),
    ...content()
});

export const crews = pgTable('crews', {
    id: id(),
    key: crewKey('key').notNull().unique(),
    titleBg: text('title_bg').notNull(),
    titleEn: text('title_en'),
    titleDe: text('title_de'),
    bodyBg: text('body_bg').notNull(),
    bodyEn: text('body_en'),
    bodyDe: text('body_de'),
    groupPhotoPath: text('group_photo_path'),
    scene: scene('scene').notNull(),
    sort: sort(),
    ...content()
});

export const crewRoles = pgTable(
    'crew_roles',
    {
        id: id(),
        crewId: uuid('crew_id')
            .notNull()
            .references(() => crews.id, { onDelete: 'cascade' }),
        tool: text('tool').$type<CrewTool>().notNull(),
        roleBg: text('role_bg').notNull(),
        roleEn: text('role_en'),
        roleDe: text('role_de'),
        years: integer('years').notNull(),
        quipBg: text('quip_bg'),
        quipEn: text('quip_en'),
        quipDe: text('quip_de'),
        sort: sort(),
        ...content()
    },
    (t) => [check('crew_roles_tool', sql`${t.tool} in (${sqlList(CREW_TOOLS)})`), check('crew_roles_years', sql`${t.years} >= 0`)]
);

export const partnerServices = pgTable(
    'partner_services',
    {
        id: id(),
        icon: text('icon').$type<ServiceIcon>().notNull(),
        titleBg: text('title_bg').notNull(),
        titleEn: text('title_en'),
        titleDe: text('title_de'),
        bodyBg: text('body_bg').notNull(),
        bodyEn: text('body_en'),
        bodyDe: text('body_de'),
        sort: sort(),
        ...content()
    },
    (t) => [check('partner_services_icon', sql`${t.icon} in (${sqlList(SERVICE_ICONS)})`)]
);

export const partners = pgTable('partners', {
    id: id(),
    name: text('name').notNull(),
    roleBg: text('role_bg').notNull(),
    roleEn: text('role_en'),
    roleDe: text('role_de'),
    logoPath: text('logo_path').notNull(),
    url: text('url'),
    sort: sort(),
    ...content()
});

export const materialBrands = pgTable('material_brands', {
    id: id(),
    name: text('name').notNull(),
    logoPath: text('logo_path').notNull(),
    url: text('url'),
    sort: sort(),
    ...content()
});

export const euProgrammes = pgTable(
    'eu_programmes',
    {
        id: id(),
        code: text('code').notNull().unique(),
        titleBg: text('title_bg').notNull(),
        titleEn: text('title_en'),
        titleDe: text('title_de'),
        summaryBg: text('summary_bg').notNull(),
        summaryEn: text('summary_en'),
        summaryDe: text('summary_de'),
        objectivesBg: text('objectives_bg').notNull(),
        objectivesEn: text('objectives_en'),
        objectivesDe: text('objectives_de'),
        resultsBg: text('results_bg').notNull(),
        resultsEn: text('results_en'),
        resultsDe: text('results_de'),
        totalBudgetEur: numeric('total_budget_eur', { precision: 14, scale: 2, mode: 'number' }).notNull(),
        euContributionEur: numeric('eu_contribution_eur', { precision: 14, scale: 2, mode: 'number' }).notNull(),
        periodStart: date('period_start').notNull(),
        periodEnd: date('period_end').notNull(),
        programmeLogoPath: text('programme_logo_path'),
        sort: sort(),
        ...content()
    },
    (t) => [
        check('eu_programmes_budget', sql`${t.euContributionEur} >= 0 and ${t.euContributionEur} <= ${t.totalBudgetEur}`),
        check('eu_programmes_period', sql`${t.periodEnd} >= ${t.periodStart}`)
    ]
);

export const publications = pgTable('publications', {
    id: id(),
    programmeId: uuid('programme_id').references(() => euProgrammes.id, { onDelete: 'set null' }),
    kind: publicationKind('kind').notNull(),
    titleBg: text('title_bg').notNull(),
    titleEn: text('title_en'),
    titleDe: text('title_de'),
    filePath: text('file_path').notNull(),
    publishedOn: date('published_on').notNull(),
    wpUrl: text('wp_url').unique(),
    ...content()
});

export const legalPages = pgTable(
    'legal_pages',
    {
        id: id(),
        slug: text('slug').$type<LegalSlug>().notNull().unique(),
        titleBg: text('title_bg').notNull(),
        titleEn: text('title_en'),
        titleDe: text('title_de'),
        bodyBg: text('body_bg').notNull(),
        bodyEn: text('body_en'),
        bodyDe: text('body_de'),
        reviewed: boolean('reviewed').notNull().default(false),
        ...content()
    },
    (t) => [check('legal_pages_slug', sql`${t.slug} in (${sqlList(LEGAL_SLUGS)})`)]
);

export const siteSettings = pgTable(
    'site_settings',
    {
        id: boolean('id').primaryKey().default(true),
        legalName: text('legal_name').notNull(),
        eik: text('eik').notNull(),
        vat: text('vat'),
        addressBg: text('address_bg').notNull(),
        addressEn: text('address_en'),
        addressDe: text('address_de'),
        phone: text('phone').notNull(),
        email: text('email').notNull(),
        privacyEmail: text('privacy_email').notNull(),
        socials: jsonb('socials').$type<Socials>().notNull().default({}),
        headlineTurnBg: text('headline_turn_bg').array().notNull(),
        headlineTurnEn: text('headline_turn_en').array(),
        headlineTurnDe: text('headline_turn_de').array(),
        quoteCta: boolean('quote_cta').notNull().default(true),
        metaTitleBg: text('meta_title_bg'),
        metaTitleEn: text('meta_title_en'),
        metaTitleDe: text('meta_title_de'),
        metaDescriptionBg: text('meta_description_bg'),
        metaDescriptionEn: text('meta_description_en'),
        metaDescriptionDe: text('meta_description_de'),
        ogImagePath: text('og_image_path'),
        ...timestamps()
    },
    (t) => [
        check('site_settings_singleton', sql`${t.id}`),
        check(
            'site_settings_headline_turn',
            sql`cardinality(${t.headlineTurnBg}) between 3 and 5 and cardinality(${t.headlineTurnEn}) between 3 and 5 and cardinality(${t.headlineTurnDe}) between 3 and 5`
        )
    ]
);

export const enquiries = pgTable(
    'enquiries',
    {
        id: id(),
        name: text('name').notNull(),
        email: text('email').notNull(),
        phone: text('phone'),
        scope: scope('scope').notNull(),
        message: text('message').notNull(),
        locale: text('locale').notNull(),
        consentAt: timestamp('consent_at', { withTimezone: true, mode: 'string' }).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull().defaultNow(),
        handledAt: timestamp('handled_at', { withTimezone: true, mode: 'string' })
    },
    (t) => [
        check('enquiries_locale', sql`${t.locale} in (${sqlList(ENQUIRY_LOCALES)})`),
        check('enquiries_email', sql`${t.email} ~ '^[^@[:space:]]+@[^@[:space:]]+$' and char_length(${t.email}) <= 320`),
        check('enquiries_lengths', sql`char_length(${t.name}) <= 200 and char_length(${t.phone}) <= 50 and char_length(${t.message}) <= 5000`)
    ]
);
