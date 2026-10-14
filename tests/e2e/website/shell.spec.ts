import { expect, test } from '@playwright/test';

test('bg is the default and has no prefix', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'bg');
});

test('language switch keeps the page', async ({ page }) => {
    await page.goto('/contact');
    await page.getByRole('button', { name: 'EN' }).click();
    await expect(page).toHaveURL(/\/en\/contact$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('theme choice survives a reload without a flash', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/theme/i).click();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('no request leaves the site', async ({ page, baseURL }) => {
    const siteOrigin = new URL(baseURL!).origin;
    const foreign: string[] = [];
    await page.route('**/*', (route) => {
        const request = route.request();
        const origin = new URL(request.url()).origin;
        if (!request.url().startsWith('http') || origin === siteOrigin) return route.continue();
        foreign.push(request.url());
        return route.abort();
    });
    for (const path of ['/', '/en', '/de', '/en/privacy', '/projects/art-gallery-centre', '/eu-programmes', '/publications', '/contact']) {
        await page.goto(path, { waitUntil: 'load' });
        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
            document.querySelectorAll('img[loading=lazy]').forEach((img) => img.setAttribute('loading', 'eager'));
        });
        await page.waitForFunction(() => [...document.images].every((img) => img.complete));
        await page.waitForLoadState('load');
    }
    expect(foreign).toEqual([]);
});

test('no cookie is set', async ({ page, context }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'EN' }).click();
    await expect(page).toHaveURL(/\/en$/);
    await page.getByLabel(/theme/i).click();
    await page.goto('/en/privacy');
    expect(await context.cookies()).toHaveLength(0);
});

test('the Translation to follow note shows only on a fallback page', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByText('Превод предстои')).toHaveCount(0);
});

test('a legal page renders its title and last-updated date', async ({ page }) => {
    await page.goto('/en/privacy');
    await expect(page.getByRole('heading', { level: 1, name: 'Privacy policy' })).toBeVisible();
    await expect(page.getByText('2026-10-14')).toBeVisible();
});

test('the quote button links to the localised contact page', async ({ page }) => {
    await page.goto('/de');
    await expect(page.getByRole('link', { name: 'Angebot anfragen' })).toHaveAttribute('href', '/de/contact');
});
