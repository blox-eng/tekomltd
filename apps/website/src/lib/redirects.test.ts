import { describe, expect, it } from 'vitest';
import { buildRedirects, exactPageRedirects } from './redirects';

const slugs = [{ slug: 'asenov-129', wpSlug: 'жилищна-сграда-с-магазини-и-гаражи', wpId: 1310, oldSlugs: ['old-asenov'] }];
const pages = [
    { slug: 'about', wpUrl: 'https://www.tekomltd.com/about/' },
    { slug: 'private-services', wpUrl: 'https://www.tekomltd.com/services/private-services/' },
    { slug: 'invitations', wpUrl: 'https://www.tekomltd.com/publications/invitations/' },
    { slug: 'careers', wpUrl: 'https://www.tekomltd.com/%D0%BA%D0%B0%D1%80%D0%B8%D0%B5%D1%80%D0%B0/' },
    { slug: 'new-page', wpUrl: null }
];
const files = [
    ['/wp-content/uploads/2026/04/x.pdf', '/media/publications/x.pdf'],
    ['/wp-content/uploads/2015/06/ГЛАДСТОН-IMG_1.jpg', '/media/projects/gladstone-44/gladston-img-1.jpg']
] as const;
const r = buildRedirects(slugs, files, pages);

describe('buildRedirects', () => {
    it("sends a service page's old paths, in every locale, straight to the Bulgarian service page", () => {
        const withServices = buildRedirects([], [], [], [{ slug: 'fasadi', oldPaths: ['/services/business-services', '/business-services'] }]);
        for (const source of ['/services/business-services', '/business-services', '/en/business-services', '/de/services/business-services'])
            expect(withServices).toContainEqual({ source, destination: '/fasadi', statusCode: 301 });
        expect(withServices.every(({ destination }) => !withServices.some((x) => x.source === destination))).toBe(true);
    });

    it('redirects the encoded WordPress project URL', () =>
        expect(r).toContainEqual(
            expect.objectContaining({
                source: '/project-view/%D0%B6%D0%B8%D0%BB%D0%B8%D1%89%D0%BD%D0%B0-%D1%81%D0%B3%D1%80%D0%B0%D0%B4%D0%B0-%D1%81-%D0%BC%D0%B0%D0%B3%D0%B0%D0%B7%D0%B8%D0%BD%D0%B8-%D0%B8-%D0%B3%D0%B0%D1%80%D0%B0%D0%B6%D0%B8/:rest*',
                destination: '/projects/asenov-129',
                statusCode: 301
            })
        ));

    it('redirects the numeric WordPress URL', () =>
        expect(r).toContainEqual(expect.objectContaining({ source: '/project-view/1310/:rest*', destination: '/projects/asenov-129', statusCode: 301 })));

    it('covers the static list and the old pages named by wp_url in the page files', () => {
        const sources = r.map((x) => x.source);
        expect(sources).toContain('/portfolio_category/:p*');
        expect(sources).toContain('/home/privacy-policy');
        expect(r.some((x) => x.source === '/about')).toBe(false); // Next strips the slash itself
        expect(r).toContainEqual(expect.objectContaining({ source: '/privacy-policy', destination: '/privacy' }));
        expect(r).toContainEqual(expect.objectContaining({ source: '/services/private-services', destination: '/private-services' }));
        expect(r).toContainEqual(expect.objectContaining({ source: '/publications/invitations', destination: '/invitations' }));
        expect(r).toContainEqual(expect.objectContaining({ source: '/%D0%BA%D0%B0%D1%80%D0%B8%D0%B5%D1%80%D0%B0', destination: '/careers' }));
        expect(r.some((x) => x.destination === '/new-page')).toBe(false);
    });

    it('redirects an imported upload to its new URL, percent-encoding Cyrillic', () => {
        expect(r).toContainEqual(
            expect.objectContaining({ source: '/wp-content/uploads/2026/04/x.pdf', destination: '/media/publications/x.pdf', statusCode: 301 })
        );
        expect(r).toContainEqual(
            expect.objectContaining({
                source: '/wp-content/uploads/2015/06/%D0%93%D0%9B%D0%90%D0%94%D0%A1%D0%A2%D0%9E%D0%9D-IMG_1.jpg',
                destination: '/media/projects/gladstone-44/gladston-img-1.jpg'
            })
        );
    });

    it('redirects an old slug in every locale', () => {
        expect(r).toContainEqual(expect.objectContaining({ source: '/projects/old-asenov', destination: '/projects/asenov-129' }));
        expect(r).toContainEqual(expect.objectContaining({ source: '/en/projects/old-asenov', destination: '/en/projects/asenov-129' }));
        expect(r).toContainEqual(expect.objectContaining({ source: '/de/projects/old-asenov', destination: '/de/projects/asenov-129' }));
    });

    it('lists each source once', () => {
        const twice = buildRedirects(slugs, [files[0], files[0]], []);
        const sources = twice.map((x) => x.source);
        expect(new Set(sources).size).toBe(sources.length);
    });

    it('skips projects without a WordPress identity and never redirects a path onto itself', () => {
        const only = buildRedirects(
            [{ slug: 'x', wpSlug: null, wpId: null, oldSlugs: [] }],
            [],
            [{ slug: 'projects', wpUrl: 'https://www.tekomltd.com/projects/' }]
        );
        expect(only.some((x) => x.source.startsWith('/project-view/') && x.destination === '/projects/x')).toBe(false);
        expect(only.every((x) => x.source.replace(/\/$/, '') !== x.destination)).toBe(true);
    });
});

describe('exactPageRedirects', () => {
    it('keeps the fixed page paths for the middleware and leaves patterns and files to Next', () => {
        const pairs = exactPageRedirects(r);
        expect(pairs).toContainEqual(['/privacy-policy', '/privacy']);
        expect(pairs).toContainEqual(['/projects/old-asenov', '/projects/asenov-129']);
        expect(pairs.some(([source]) => source.includes(':'))).toBe(false);
        expect(pairs.some(([source]) => source.startsWith('/wp-content/'))).toBe(false);
    });
});
