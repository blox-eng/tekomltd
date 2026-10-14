import { expect, test } from '@playwright/test';

const get = (request: import('@playwright/test').APIRequestContext, path: string) => request.get(path, { maxRedirects: 0 });

const redirects: [string, string][] = [
    [
        '/project-view/%D0%B6%D0%B8%D0%BB%D0%B8%D1%89%D0%BD%D0%B0-%D1%81%D0%B3%D1%80%D0%B0%D0%B4%D0%B0-%D1%81-%D0%BC%D0%B0%D0%B3%D0%B0%D0%B7%D0%B8%D0%BD%D0%B8-%D0%B8-%D0%B3%D0%B0%D1%80%D0%B0%D0%B6%D0%B8',
        '/projects/asenov-129'
    ],
    ['/project-view/1849/sub/page', '/projects/asenov-129'],
    ['/services/private-services', '/private-services'],
    ['/privacy-policy', '/privacy'],
    ['/home/privacy-policy', '/privacy'],
    ['/publications/invitations', '/invitations'],
    ['/portfolio_category/foo', '/projects'],
    ['/wp-content/uploads/2015/06/%D0%93%D0%9B%D0%90%D0%94%D0%A1%D0%A2%D0%9E%D0%9D-IMG_1.jpg', '/media/projects/gladstone-44/gladston-img-1.jpg']
];

for (const [from, to] of redirects) {
    test(`old URL ${decodeURIComponent(from)} redirects permanently to ${to}`, async ({ request }) => {
        const res = await get(request, from);
        expect([301, 308]).toContain(res.status());
        expect(new URL(res.headers().location!, 'http://x').pathname).toBe(to);
    });
}

test('a trailing-slash WordPress URL ends on the new page', async ({ request }) => {
    for (const from of ['/about/', '/services/private-services/']) {
        const res = await request.get(from);
        expect(res.status()).toBe(200);
    }
});

test('the redirected upload serves the file', async ({ request }) => {
    const res = await request.get('/wp-content/uploads/2015/06/gladston_1.jpg');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('image/');
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
    expect(sitemap).toContain('/projects/asenov-129');
    expect(sitemap).toContain('hreflang="de"');
});

test('a project page carries canonical, hreflang, Open Graph image and JSON-LD', async ({ page }) => {
    await page.goto('/en/projects/gladstone-44');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/en\/projects\/gladstone-44$/);
    for (const lang of ['bg', 'en', 'de', 'x-default']) await expect(page.locator(`link[rel="alternate"][hreflang="${lang}"]`)).toHaveCount(1);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/media\/projects\/gladstone-44\//);
    const types = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.map((n) => JSON.parse(n.textContent!)['@type']));
    expect(types).toEqual(expect.arrayContaining(['HomeAndConstructionBusiness', 'CreativeWork', 'BreadcrumbList']));
});
