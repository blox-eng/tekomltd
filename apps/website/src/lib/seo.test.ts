import { describe, expect, it } from 'vitest';
import type { ProjectDetail } from '../content/projects';
import { businessJsonLd, projectJsonLd } from './jsonld';
import { alternates, SITE_URL, urlFor } from './seo';

describe('alternates', () => {
    it('lists bg, en, de and x-default, with bg unprefixed', () => {
        expect(alternates('/projects/x')).toEqual({
            canonical: `${SITE_URL}/projects/x`,
            languages: {
                bg: `${SITE_URL}/projects/x`,
                en: `${SITE_URL}/en/projects/x`,
                de: `${SITE_URL}/de/projects/x`,
                'x-default': `${SITE_URL}/projects/x`
            }
        });
    });

    it('makes the canonical follow the locale', () => {
        expect(alternates('/contact', 'de')?.canonical).toBe(`${SITE_URL}/de/contact`);
    });

    it('maps the home page to the bare locale root', () => {
        expect(urlFor('/', 'bg')).toBe(`${SITE_URL}/`);
        expect(urlFor('/', 'en')).toBe(`${SITE_URL}/en`);
    });
});

const settings = {
    legalName: 'ТЕКОМ ООД',
    address: 'ул. Асенов 119, Стара Загора',
    phone: '+359 88 506 9099',
    email: 'info@tekomltd.com',
    socials: { linkedin: 'https://www.linkedin.com/company/x/' }
};

describe('businessJsonLd', () => {
    const ld = businessJsonLd(settings as never);
    it('describes the business', () => {
        expect(ld['@type']).toBe('HomeAndConstructionBusiness');
        expect(ld).toMatchObject({
            name: 'ТЕКОМ ООД',
            telephone: '+359 88 506 9099',
            address: { streetAddress: settings.address },
            sameAs: [settings.socials.linkedin]
        });
        expect(ld.geo).toMatchObject({ '@type': 'GeoCoordinates' });
    });
    it('leaves sameAs out when there are no socials', () => {
        expect('sameAs' in businessJsonLd({ ...settings, socials: {} } as never)).toBe(false);
    });
});

const detail = (pin: { lat: number; lng: number } | null) =>
    ({
        slug: 'x',
        title: 'Title',
        summary: 'Summary',
        place: 'Stara Zagora',
        year: 2020,
        cover: { src: '/media/projects/x/c.jpg', width: 10, height: 10, alt: 'a' },
        pin
    }) as ProjectDetail;

describe('projectJsonLd', () => {
    it('adds locationCreated.geo only when the pin exists', () => {
        expect(projectJsonLd(detail({ lat: 42.4, lng: 25.6 }), 'bg').locationCreated).toMatchObject({ geo: { latitude: 42.4, longitude: 25.6 } });
        expect('geo' in (projectJsonLd(detail(null), 'bg').locationCreated ?? {})).toBe(false);
    });
    it('links the cover image by absolute URL', () => {
        expect(projectJsonLd(detail(null), 'en').image).toBe(`${SITE_URL}/media/projects/x/c.jpg`);
        expect(projectJsonLd(detail(null), 'en').url).toBe(`${SITE_URL}/en/projects/x`);
    });
});
