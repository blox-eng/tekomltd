import type { Locale } from '@tekom/i18n';
import { defaultRoot, imgOrNull, once, readYaml, text, textOrNull, type Img } from './load';
import { SETTINGS_FILE } from './paths';
import { Settings, type L } from './schema';

type PageKey = 'projects' | 'contact' | 'eu_programmes' | 'publications';
/** Only the locale's own text: the page falls back to its heading or lead instead of Bulgarian. */
type PageText = Record<PageKey, string | null>;

const pageText = (texts: Partial<Record<PageKey, L>>, locale: Locale): PageText => ({
    projects: texts.projects?.[locale] ?? null,
    contact: texts.contact?.[locale] ?? null,
    eu_programmes: texts.eu_programmes?.[locale] ?? null,
    publications: texts.publications?.[locale] ?? null
});

export type SiteSettings = {
    legalName: string;
    founded: number;
    eik: string | null;
    vat: string | null;
    address: string;
    phone: string;
    phoneHref: string;
    hours: string | null;
    email: string;
    privacyEmail: string;
    socials: { linkedin?: string; instagram?: string; facebook?: string };
    profiles: string[];
    crewHeadline: string[];
    quoteCta: boolean;
    metaTitle: string | null;
    metaDescription: string | null;
    pageTitles: PageText;
    pageDescriptions: PageText;
    ogImage: Img | null;
};

export function getSettings(locale: Locale, root: string = defaultRoot()): SiteSettings {
    const s = once(root, 'settings', () => readYaml(root, SETTINGS_FILE, Settings));
    return {
        legalName: s.legal_name,
        founded: s.founded,
        eik: s.eik ?? null,
        vat: s.vat ?? null,
        address: text(s.address, locale),
        phone: s.phone,
        phoneHref: `tel:${s.phone.replace(/[^\d+]/g, '')}`,
        hours: textOrNull(s.hours, locale),
        email: s.email,
        privacyEmail: s.privacy_email,
        socials: s.socials,
        profiles: s.profiles,
        crewHeadline: s.crew_headline[locale] ?? s.crew_headline.bg,
        quoteCta: s.quote_cta,
        metaTitle: textOrNull(s.meta_title, locale),
        // A locale without its own description gets none: a Bulgarian snippet under an English result reads as broken.
        metaDescription: s.meta_description?.[locale] ?? null,
        pageTitles: pageText(s.page_titles, locale),
        pageDescriptions: pageText(s.page_descriptions, locale),
        ogImage: imgOrNull(root, SETTINGS_FILE, s.og_image, text(s.meta_title ?? { bg: s.legal_name }, locale))
    };
}
