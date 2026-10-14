import type { Locale } from '@tekom/i18n';
import type { ProjectDetail } from '../content/projects';
import type { SiteSettings } from '../content/settings';
import { SITE_URL, urlFor } from './seo';

/** The Tekom office, ул. „Хаджи Димитър Асенов“ 119. */
const OFFICE_GEO = { '@type': 'GeoCoordinates', latitude: 42.4274839, longitude: 25.623601 } as const;

export function businessJsonLd({ legalName, address, phone, email, socials }: Pick<SiteSettings, 'legalName' | 'address' | 'phone' | 'email' | 'socials'>) {
    const sameAs = Object.values(socials).filter((url): url is string => Boolean(url));
    return {
        '@context': 'https://schema.org',
        '@type': 'HomeAndConstructionBusiness',
        name: legalName,
        url: SITE_URL,
        telephone: phone,
        email,
        address: { '@type': 'PostalAddress', streetAddress: address, addressLocality: 'Stara Zagora', addressCountry: 'BG' },
        geo: OFFICE_GEO,
        ...(sameAs.length > 0 && { sameAs })
    };
}

export function projectJsonLd(project: ProjectDetail, locale: Locale) {
    return {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: project.title,
        url: urlFor(`/projects/${project.slug}`, locale),
        image: `${SITE_URL}${project.cover.src}`,
        ...(project.summary && { description: project.summary }),
        ...(project.year && { dateCreated: String(project.year) }),
        locationCreated: {
            '@type': 'Place',
            name: project.place,
            ...(project.pin && { geo: { '@type': 'GeoCoordinates', latitude: project.pin.lat, longitude: project.pin.lng } })
        }
    };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[], locale: Locale) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: trail.map(({ name, path }, i) => ({ '@type': 'ListItem', position: i + 1, name, item: urlFor(path, locale) }))
    };
}
