import { expect, test } from '@playwright/test';

// What Viber, WhatsApp, Facebook, LinkedIn and X read when someone shares a link.
const PAGES = ['/', '/en', '/projects', '/contact', '/eu-programmes', '/publications', '/projects/river-house', '/de/projects/river-house'];

const meta = (page: import('@playwright/test').Page, key: string) =>
    page.locator(`meta[property="${key}"], meta[name="${key}"]`).first().getAttribute('content');

for (const path of PAGES) {
    test(`${path} shares a 1200×630 photo with a title and the site name`, async ({ page, request }) => {
        await page.goto(path);
        const image = await meta(page, 'og:image');
        expect(image).toMatch(/^https?:\/\/[^/]+\/og\/[0-9a-f]{12}\.jpg$/);
        expect(await meta(page, 'og:image:width')).toBe('1200');
        expect(await meta(page, 'og:image:height')).toBe('630');
        expect(await meta(page, 'og:image:alt')).toBeTruthy();
        expect(await meta(page, 'og:title')).toBeTruthy();
        expect(await meta(page, 'og:site_name')).toBe(path.startsWith('/en') || path.startsWith('/de') ? 'Tekom' : 'Теком');
        expect(await meta(page, 'twitter:card')).toBe('summary_large_image');

        const response = await request.get(new URL(image!).pathname);
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toBe('image/jpeg');
    });
}

test('each project shares its own photo', async ({ page }) => {
    await page.goto('/projects/river-house');
    const river = await meta(page, 'og:image');
    await page.goto('/projects/town-flat');
    expect(await meta(page, 'og:image')).not.toBe(river);
});
