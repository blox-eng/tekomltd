import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// The site under test is `baseURL`: SITE_URL for `pnpm test:smoke`, TEST_BASE_URL in the full e2e run.
const PAGES = ['/', '/en/projects', '/projects/ravda-conversion', '/eu-programmes', '/contact', '/privacy'];

for (const path of PAGES) {
    test(`smoke ${path}`, async ({ page, baseURL }) => {
        const siteHost = new URL(baseURL!).host;
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
    });
}
