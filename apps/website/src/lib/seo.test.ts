import { describe, expect, it } from 'vitest';
import type { ProjectDetail } from '../content/projects';
import type { ServiceDetail } from '../content/services';
import { BUSINESS_ID, businessJsonLd, projectJsonLd, serviceJsonLd } from './jsonld';
import { alternates, brandName, languageUrls, pageMetadata, publishedLocales, SITE_URL, siteUrlFrom, urlFor } from './seo';

const IMAGE = { url: '/og/abc.jpg', width: 1200, height: 630, alt: 'Фасада' };

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
    founded: 1991,
    address: 'ул. Асенов 119, Стара Загора, 6000',
    phone: '+359 88 506 9099',
    email: 'info@tekomltd.com',
    socials: { linkedin: 'https://www.linkedin.com/company/x/' },
    profiles: [] as string[]
};

describe('fallback locales', () => {
    it('point the canonical at the Bulgarian page and drop out of hreflang', () => {
        const alt = alternates('/about', 'de', ['en', 'de']);
        expect(alt?.canonical).toBe(`${SITE_URL}/about`);
        expect(Object.keys(alt?.languages ?? {})).toEqual(['bg', 'x-default']);
    });
    it('keep the own canonical for a locale with real content', () => {
        const alt = alternates('/projects/x', 'en', ['de']);
        expect(alt?.canonical).toBe(`${SITE_URL}/en/projects/x`);
        expect(Object.keys(alt?.languages ?? {})).toEqual(['bg', 'en', 'x-default']);
    });
    it('leave fallback locales out of the sitemap', () => {
        expect(publishedLocales(['en', 'de'])).toEqual(['bg']);
        expect(Object.keys(languageUrls('/p', ['de']))).not.toContain('de');
    });
    it('use full OG locale codes', () => {
        expect(pageMetadata({ locale: 'de', path: '/contact', title: 'x', image: IMAGE }).openGraph).toMatchObject({
            locale: 'de_DE',
            url: `${SITE_URL}/de/contact`
        });
    });
    it('carry the share image', () => {
        expect(pageMetadata({ locale: 'bg', path: '/', title: 'x', image: IMAGE }).openGraph).toMatchObject({ images: [IMAGE] });
    });
    it('name the site in the page language', () => {
        expect(pageMetadata({ locale: 'bg', path: '/', title: 'x', image: IMAGE }).openGraph).toMatchObject({ siteName: 'Теком' });
        expect(pageMetadata({ locale: 'en', path: '/', title: 'x', image: IMAGE }).openGraph).toMatchObject({ siteName: 'Tekom' });
    });
});

describe('siteUrlFrom', () => {
    it('prefers SITE_URL and drops a trailing slash', () => {
        expect(siteUrlFrom({ SITE_URL: 'https://tekomltd.com/', CONTEXT: 'production', URL: 'https://x.netlify.app' })).toBe('https://tekomltd.com');
    });
    it('uses the Netlify site URL in production', () => {
        expect(siteUrlFrom({ CONTEXT: 'production', URL: 'https://x.netlify.app', DEPLOY_PRIME_URL: 'https://main--x.netlify.app' })).toBe(
            'https://x.netlify.app'
        );
    });
    it('uses the deploy URL on a preview, so its links and share images point at the preview', () => {
        expect(siteUrlFrom({ CONTEXT: 'deploy-preview', URL: 'https://x.netlify.app', DEPLOY_PRIME_URL: 'https://deploy-preview-7--x.netlify.app' })).toBe(
            'https://deploy-preview-7--x.netlify.app'
        );
    });
    it('falls back to tekomltd.com off Netlify', () => {
        expect(siteUrlFrom({})).toBe('https://tekomltd.com');
    });
});

describe('brandName', () => {
    it('is Cyrillic in Bulgarian only', () => {
        expect(brandName('bg')).toBe('Теком');
        expect(brandName('de')).toBe('Tekom');
    });
});

describe('businessJsonLd', () => {
    const ld = businessJsonLd(settings as never);
    it('describes the business', () => {
        expect(ld['@type']).toBe('GeneralContractor');
        expect(ld).toMatchObject({
            '@id': BUSINESS_ID,
            name: 'ТЕКОМ ООД',
            foundingDate: '1991',
            telephone: '+359 88 506 9099',
            address: { streetAddress: 'ул. Асенов 119' },
            sameAs: [settings.socials.linkedin]
        });
        expect(ld.geo).toMatchObject({ '@type': 'GeoCoordinates' });
    });
    it('splits the address and localises the city', () => {
        expect(ld.address).toMatchObject({ postalCode: '6000', addressLocality: 'Стара Загора', streetAddress: 'ул. Асенов 119' });
        const en = businessJsonLd({ ...settings, address: '119 Asenov St, Tekom Centre, 6000 Stara Zagora, Bulgaria' } as never, 'en');
        expect(en.address).toMatchObject({ streetAddress: '119 Asenov St, Tekom Centre', addressLocality: 'Stara Zagora' });
    });
    it('omits an empty phone or e-mail', () => {
        const bare = businessJsonLd({ ...settings, phone: '', email: '' } as never);
        expect('telephone' in bare || 'email' in bare).toBe(false);
    });
    it('leaves sameAs out when there are no socials or profiles', () => {
        expect('sameAs' in businessJsonLd({ ...settings, socials: {}, profiles: [] } as never)).toBe(false);
    });
    it('adds the profiles to sameAs', () => {
        expect(businessJsonLd({ ...settings, profiles: ['https://ksb.bg/member/x/'] } as never).sameAs).toEqual([
            settings.socials.linkedin,
            'https://ksb.bg/member/x/'
        ]);
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

describe('serviceJsonLd', () => {
    const service = {
        slug: 'fasadi',
        name: 'Фасади и топлоизолация',
        h1: 'Фасади и топлоизолация в Стара Загора',
        metaDescription: 'Описание',
        cover: { cover: { src: '/media/projects/x/c.jpg' } }
    } as ServiceDetail;
    const ld = serviceJsonLd(service, 'bg');
    it('names the business as provider by its @id', () => {
        expect(ld.provider).toEqual({ '@id': BUSINESS_ID });
        expect(businessJsonLd(settings as never)['@id']).toBe(BUSINESS_ID);
    });
    it('links the page and serves the area around Stara Zagora', () => {
        expect(ld).toMatchObject({ '@type': 'Service', url: `${SITE_URL}/fasadi`, image: `${SITE_URL}/media/projects/x/c.jpg` });
        expect(ld.areaServed).toMatchObject({ '@type': 'GeoCircle', geoRadius: 60_000 });
    });
});

describe('pageMetadata without translations', () => {
    it('keeps the canonical and leaves hreflang out', () => {
        const meta = pageMetadata({ locale: 'bg', path: '/fasadi', title: 'T', image: { url: '/og/x.jpg', width: 1, height: 1, alt: '' }, translated: false });
        expect(meta.alternates).toEqual({ canonical: `${SITE_URL}/fasadi` });
    });
});
