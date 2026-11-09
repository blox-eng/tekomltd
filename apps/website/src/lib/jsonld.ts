import type { Locale } from '@tekom/i18n';
import type { ProjectDetail } from '../content/projects';
import type { ServiceDetail } from '../content/services';
import type { SiteSettings } from '../content/settings';
import { SITE_URL, urlFor } from './seo';

/** The Tekom office, ул. „Хаджи Димитър Асенов“ 119. */
const OFFICE_GEO = { '@type': 'GeoCoordinates', latitude: 42.4274839, longitude: 25.623601 } as const;

/** One node for the company, so every page's structured data can point at it instead of repeating it. */
export const BUSINESS_ID = `${SITE_URL}/#business`;

/** Where the services are offered: Stara Zagora and the towns within an hour's drive. */
const SERVICE_AREA = { '@type': 'GeoCircle', geoMidpoint: OFFICE_GEO, geoRadius: 60_000 } as const;

const POSTAL_CODE = '6000';
const CITY: Record<Locale, string> = { bg: 'Стара Загора', en: 'Stara Zagora', de: 'Stara Zagora' };
const NOT_STREET = /\b6000\b|Стара Загора|Stara Zagora|Stara Sagora|България|Bulgaria|Bulgarien/g;

/** The settings address is one line; the street part is what remains without postcode, city and country. */
const streetOf = (address: string) =>
    address
        .replace(NOT_STREET, '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .join(', ');

export function businessJsonLd(
    {
        legalName,
        founded,
        address,
        phone,
        email,
        socials,
        profiles
    }: Pick<SiteSettings, 'legalName' | 'founded' | 'address' | 'phone' | 'email' | 'socials' | 'profiles'>,
    locale: Locale = 'bg'
) {
    const sameAs = [...Object.values(socials).filter((url): url is string => Boolean(url)), ...profiles];
    return {
        '@context': 'https://schema.org',
        '@type': 'GeneralContractor',
        '@id': BUSINESS_ID,
        name: legalName,
        url: SITE_URL,
        foundingDate: String(founded),
        ...(phone && { telephone: phone }),
        ...(email && { email }),
        address: { '@type': 'PostalAddress', streetAddress: streetOf(address), postalCode: POSTAL_CODE, addressLocality: CITY[locale], addressCountry: 'BG' },
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

export function serviceJsonLd(service: ServiceDetail, locale: Locale) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: service.h1,
        serviceType: service.name,
        description: service.metaDescription,
        url: urlFor(`/${service.slug}`, locale),
        image: `${SITE_URL}${service.cover.cover.src}`,
        provider: { '@id': BUSINESS_ID },
        areaServed: SERVICE_AREA
    };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[], locale: Locale) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: trail.map(({ name, path }, i) => ({ '@type': 'ListItem', position: i + 1, name, item: urlFor(path, locale) }))
    };
}
