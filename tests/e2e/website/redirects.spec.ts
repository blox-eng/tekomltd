import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

// Project and page values come from tests/fixtures/content; file addresses from the importer's url-map.

const get = (request: import('@playwright/test').APIRequestContext, path: string) => request.get(path, { maxRedirects: 0 });

const urlMap: { files: Record<string, string> } = JSON.parse(
    readFileSync(join(__dirname, '..', '..', '..', 'design', 'wordpress-snapshot', 'url-map.json'), 'utf8')
);
const fileRedirects = Object.entries(urlMap.files);
const cyrillicFile = fileRedirects.find(([from]) => /[а-яА-Я]/.test(from))!;

const redirects: [string, string][] = [
    [`/project-view/${encodeURIComponent('къща-край-реката')}`, '/projects/river-house'],
    ['/project-view/1001/sub/page', '/projects/river-house'],
    ['/projects/old-river-house', '/projects/river-house'],
    ['/en/projects/old-river-house', '/en/projects/river-house'],
    ['/company/about-us', '/about'],
    ['/privacy-policy', '/privacy'],
    ['/home/privacy-policy', '/privacy'],
    ['/portfolio_category/foo', '/projects'],
    [encodeURI(fileRedirects[0]![0]), fileRedirects[0]![1]],
    [encodeURI(cyrillicFile[0]), cyrillicFile[1]]
];

for (const [from, to] of redirects) {
    test(`old URL ${decodeURIComponent(from)} redirects permanently to ${to}`, async ({ request }) => {
        const res = await get(request, from);
        expect(res.status()).toBe(301);
        expect(new URL(res.headers().location!, 'http://x').pathname).toBe(to);
    });
}

test('a trailing-slash WordPress URL ends on the new page', async ({ request }) => {
    for (const from of ['/about/', '/company/about-us/']) {
        const res = await request.get(from);
        expect(res.status()).toBe(200);
    }
});

test('an old address keeps its query string, so campaign tags survive the redirect', async ({ request }) => {
    const res = await get(request, '/privacy-policy?utm_source=x');
    expect(res.status()).toBe(301);
    expect(new URL(res.headers().location!, 'http://x').search).toBe('?utm_source=x');
});

test('WordPress admin addresses answer 410', async ({ request }) => {
    for (const path of ['/wp-login.php', '/xmlrpc.php', '/wp-admin', '/wp-admin/admin-ajax.php']) {
        expect((await get(request, path)).status(), path).toBe(410);
    }
});

test('other wp-content URLs and unpublished archive files stay 404', async ({ request }) => {
    expect((await get(request, '/wp-content/plugins/x/y.js')).status()).toBe(404);
    expect((await get(request, '/wp-content/uploads/2015/12/IMG_7639.jpg')).status()).toBe(404);
});

test('robots.txt and sitemap.xml are served with the alternates', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Allow: /');
    expect(robots).toMatch(/Sitemap: https?:\/\/[^/]+\/sitemap\.xml/);
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('/projects/river-house');
    expect(sitemap).not.toContain('/projects/secret-site');
    expect(sitemap).toContain('hreflang="de"');
});

test('a project page carries canonical, hreflang, Open Graph image and JSON-LD', async ({ page }) => {
    await page.goto('/en/projects/river-house');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/en\/projects\/river-house$/);
    for (const lang of ['bg', 'en', 'de', 'x-default']) await expect(page.locator(`link[rel="alternate"][hreflang="${lang}"]`)).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\/[0-9a-f]{12}\.jpg$/);
    const types = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.map((n) => JSON.parse(n.textContent!)['@type']));
    expect(types).toEqual(expect.arrayContaining(['GeneralContractor', 'CreativeWork', 'BreadcrumbList']));
});

test('a fallback-locale page canonicalises to the Bulgarian page and leaves hreflang', async ({ page }) => {
    await page.goto('/en/about');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/about$/);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(0);
    await expect(page.locator('link[rel="alternate"][hreflang="bg"]')).toHaveCount(1);
});

test('no response sends an hreflang Link header that would contradict the page', async ({ request }) => {
    for (const path of ['/', '/en/about', '/de/projects/stone-chapel']) {
        const res = await request.get(path);
        expect(res.status(), path).toBe(200);
        expect(res.headers().link, path).toBeUndefined();
    }
});

test('the home page carries the Bulgarian description, and /en none', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', 'Тестово описание на началната страница.');
    await page.goto('/en');
    await expect(page.locator('meta[name="description"]')).toHaveCount(0);
});
