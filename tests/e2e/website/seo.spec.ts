import { expect, test, type APIRequestContext } from '@playwright/test';

// Every page the sitemap publishes must be ready for search. Runs on the real content: the CI check job's build and `pnpm test:smoke`.
// Sitemap and canonical URLs carry SITE_URL's origin, which is not the server under test, so only their paths are fetched.
const pathOf = (url: string) => {
    const { pathname, search } = new URL(url);
    return pathname + search;
};

async function sitemapPaths(request: APIRequestContext): Promise<string[]> {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const urls = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
    expect(urls.length).toBeGreaterThan(0);
    return urls.map(pathOf);
}

test('every page in the sitemap has a title, description, canonical, share image and JSON-LD, and is indexable', async ({ request }) => {
    const problems: string[] = [];
    for (const path of await sitemapPaths(request)) {
        const res = await request.get(path);
        if (res.status() !== 200) {
            problems.push(`${path}: status ${res.status()}`);
            continue;
        }
        const html = await res.text();
        const head = html.slice(0, html.indexOf('</head>'));
        const meta = (attr: string, value: string) =>
            new RegExp(`<meta[^>]*${attr}="${value}"[^>]*content="([^"]*)"`).exec(head)?.[1] ??
            new RegExp(`<meta[^>]*content="([^"]*)"[^>]*${attr}="${value}"`).exec(head)?.[1];

        const title = /<title>([^<]*)<\/title>/.exec(head)?.[1]?.trim();
        if (!title) problems.push(`${path}: no <title>`);
        if (!meta('name', 'description')?.trim()) problems.push(`${path}: no meta description`);
        if (/noindex/i.test(meta('name', 'robots') ?? '') || /noindex/i.test(res.headers()['x-robots-tag'] ?? '')) problems.push(`${path}: noindex`);

        const canonical = /<link[^>]*rel="canonical"[^>]*href="([^"]+)"/.exec(head)?.[1];
        if (!canonical) problems.push(`${path}: no canonical`);

        const ogImage = meta('property', 'og:image');
        if (!ogImage) problems.push(`${path}: no og:image`);
        else {
            const image = await request.get(pathOf(ogImage));
            if (image.status() !== 200 || !image.headers()['content-type']?.startsWith('image/'))
                problems.push(`${path}: og:image ${pathOf(ogImage)} answers ${image.status()} ${image.headers()['content-type']}`);
        }

        const blocks = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]!);
        if (blocks.length === 0) problems.push(`${path}: no JSON-LD`);
        for (const block of blocks) {
            try {
                const data = JSON.parse(block);
                for (const item of Array.isArray(data) ? data : (data['@graph'] ?? [data])) {
                    if (!String(data['@context'] ?? item['@context'] ?? '').includes('schema.org') || !item['@type'])
                        problems.push(`${path}: JSON-LD without schema.org @context or @type`);
                }
            } catch {
                problems.push(`${path}: JSON-LD does not parse`);
            }
        }
    }
    expect(problems).toEqual([]);
});
