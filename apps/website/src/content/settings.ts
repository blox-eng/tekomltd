import type { Locale } from '@tekom/i18n';
import { defaultRoot, imgOrNull, once, readYaml, text, textOrNull, type Img } from './load';
import { SETTINGS_FILE } from './paths';
import { Settings } from './schema';

export type SiteSettings = {
    legalName: string;
    founded: number;
    eik: string | null;
    vat: string | null;
    address: string;
    phone: string;
    phoneAlt: string | null;
    hours: string | null;
    email: string;
    privacyEmail: string;
    socials: { linkedin?: string; instagram?: string; facebook?: string };
    crewHeadline: string[];
    quoteCta: boolean;
    metaTitle: string | null;
    metaDescription: string | null;
    pageDescriptions: { projects: string | null; publications: string | null };
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
        phoneAlt: s.phone_alt ?? null,
        hours: textOrNull(s.hours, locale),
        email: s.email,
        privacyEmail: s.privacy_email,
        socials: s.socials,
        crewHeadline: s.crew_headline[locale] ?? s.crew_headline.bg,
        quoteCta: s.quote_cta,
        metaTitle: textOrNull(s.meta_title, locale),
        // Descriptions are Tekom's own Bulgarian copy; en and de get none rather than a translation nobody reviewed.
        metaDescription: s.meta_description?.[locale] ?? null,
        pageDescriptions: { projects: s.page_descriptions.projects?.[locale] ?? null, publications: s.page_descriptions.publications?.[locale] ?? null },
        ogImage: imgOrNull(root, SETTINGS_FILE, s.og_image, text(s.meta_title ?? { bg: s.legal_name }, locale))
    };
}
