import { expect, test } from '@playwright/test';

// Values come from tests/fixtures/content/services: /fasadi lists the `facade` projects, /restavratsiya the `restore` ones.

test('a service page shows only the projects of its scope, and asks for contact', async ({ page }) => {
    await page.goto('/fasadi');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1, name: 'Фасади в Стара Загора' })).toBeVisible();
    const grid = page.getByRole('list').filter({ has: page.locator('a[href="/projects/river-house"]') });
    await expect(grid.getByRole('heading', { name: 'Къща край реката' })).toBeVisible();
    await expect(page.locator('main a[href="/projects/stone-chapel"]')).toHaveCount(0);
    await expect(page.getByRole('cell', { name: 'Къща край реката' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Поискайте оглед/ }).last()).toHaveAttribute('href', '/contact');

    await page.goto('/restavratsiya');
    await expect(page.locator('main a[href="/projects/stone-chapel"]').first()).toBeVisible();
    await expect(page.locator('main a[href="/projects/river-house"]')).toHaveCount(0);
});

test('a service page links the business as provider and has a canonical without hreflang', async ({ page }) => {
    await page.goto('/fasadi');
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const data = blocks.map((b) => JSON.parse(b));
    const business = data.find((d) => d['@type'] === 'GeneralContractor');
    const service = data.find((d) => d['@type'] === 'Service');
    expect(service.provider).toEqual({ '@id': business['@id'] });
    expect(data.some((d) => d['@type'] === 'BreadcrumbList')).toBe(true);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/fasadi$/);
    await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(0);
});

test('a service exists only in the locales it is written in', async ({ request }) => {
    expect((await request.get('/en/fasadi')).status()).toBe(404);
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toMatch(/<loc>[^<]*\/fasadi<\/loc>/);
    expect(sitemap).not.toMatch(/\/en\/fasadi/);
});

test('an old address of the service redirects to it in one hop', async ({ request }) => {
    for (const path of ['/old-services', '/en/old-services']) {
        const res = await request.get(path, { maxRedirects: 0 });
        expect(res.status()).toBe(301);
        expect(new URL(res.headers().location!, 'http://x').pathname).toBe('/fasadi');
    }
});

test('the header services menu opens, lists the services and closes with Escape', async ({ page }) => {
    await page.goto('/projects');
    const button = page.getByRole('button', { name: 'Услуги' });
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('link', { name: /Фасади.*По-топъл дом/ })).toHaveAttribute('href', '/fasadi');
    await expect(page.getByRole('link', { name: /Реставрация.*Стари сгради/ })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toBeFocused();

    await page.goto('/fasadi');
    await expect(page.getByRole('button', { name: 'Услуги' })).toHaveAttribute('aria-current', 'page');
});

test('the header keeps EU programmes as a small mark and English links to the home services', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Европрограми' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Европрограми' }).first()).toHaveAttribute('href', '/eu-programmes');
    await page.goto('/en');
    await expect(page.getByRole('button', { name: 'Services' })).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Services' })).toHaveAttribute('href', '/en#services');
});

test('a project page links to the services that list it', async ({ page }) => {
    await page.goto('/projects/river-house');
    await expect(page.locator('main a[href="/fasadi"]')).toBeVisible();
    await expect(page.locator('main a[href="/restavratsiya"]')).toHaveCount(0);
    await page.goto('/projects/town-flat');
    await expect(page.locator('main a[href="/fasadi"], main a[href="/restavratsiya"]')).toHaveCount(0);
});

test('the services menu fits a phone screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/fasadi');
    await page.getByRole('button', { name: 'Услуги' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
