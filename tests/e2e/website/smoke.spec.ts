import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Structural checks only, so they hold for any content. The site under test is `baseURL`:
// SITE_URL for `pnpm test:smoke` (real content), TEST_BASE_URL in the full e2e run (fixture content).
const PAGES = ['/', '/en/projects', '/eu-programmes', '/publications', '/contact', '/privacy'];

async function smoke(page: Page, baseURL: string, path: string) {
    const siteHost = new URL(baseURL).host;
    const consoleErrors: string[] = [];
    const foreignHosts: string[] = [];
    page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('request', (request) => {
        const url = new URL(request.url());
        if (url.protocol.startsWith('http') && url.host !== siteHost) foreignHosts.push(request.url());
    });

    const response = await page.goto(path, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);

    const { violations } = await new AxeBuilder({ page }).analyze();
    const blocking = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(blocking.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);

    expect(consoleErrors).toEqual([]);
    expect(foreignHosts).toEqual([]);
}

for (const path of PAGES) {
    test(`smoke ${path}`, async ({ page, baseURL }) => smoke(page, baseURL!, path));
}

test('smoke the first project page', async ({ page, baseURL }) => {
    await page.goto('/projects');
    const href = await page.locator('main a[href^="/projects/"]').first().getAttribute('href');
    expect(href).toMatch(/^\/projects\/[a-z0-9-]+$/);
    await smoke(page, baseURL!, href!);
});

test('an old WordPress upload address serves the file', async ({ request }) => {
    test.skip(!process.env.SITE_URL, 'the e2e fixture content holds none of the imported files');
    const urlMap: { files: Record<string, string> } = JSON.parse(
        readFileSync(join(__dirname, '..', '..', '..', 'design', 'wordpress-snapshot', 'url-map.json'), 'utf8')
    );
    const [from] = Object.entries(urlMap.files)[0]!;
    const res = await request.get(encodeURI(from));
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/^(image\/|application\/)/);
});
