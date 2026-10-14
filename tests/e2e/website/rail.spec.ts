import { expect, test } from '@playwright/test';

const counter = (page: import('@playwright/test').Page) => page.locator('[data-rail-count]');

test.describe('rail on a phone', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('every slide is the full viewport width', async ({ page }) => {
        await page.goto('/');
        const widths = await page.locator('[data-rail-track] > *').evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().width)));
        expect(widths.length).toBeGreaterThan(3);
        expect(new Set(widths)).toEqual(new Set([390]));
    });

    test('the counter starts at 01 and changes after a swipe', async ({ page }) => {
        await page.goto('/');
        await expect(counter(page)).toHaveText(/^01 \/ \d{2}$/);
        await page.locator('[data-rail-track]').evaluate((el) => el.scrollTo({ left: el.clientWidth, behavior: 'instant' }));
        await expect(counter(page)).toHaveText(/^02 \/ \d{2}$/);
    });
});

test.describe('rail on desktop', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('the arrow buttons scroll the rail and the counter follows', async ({ page }) => {
        await page.goto('/');
        const track = page.locator('[data-rail-track]');
        await expect(counter(page)).toHaveText(/^01 \//);
        await page.getByRole('button', { name: 'Next' }).click();
        await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBeGreaterThan(100);
        await expect(counter(page)).toHaveText(/^02 \//);
        await page.getByRole('button', { name: 'Previous' }).click();
        await expect(counter(page)).toHaveText(/^01 \//);
    });

    test('the arrow keys scroll the rail', async ({ page }) => {
        await page.goto('/');
        await page.locator('[data-rail-track] a').first().focus();
        await page.keyboard.press('ArrowRight');
        await expect(counter(page)).toHaveText(/^02 \//);
        await page.keyboard.press('ArrowLeft');
        await expect(counter(page)).toHaveText(/^01 \//);
    });

    test('the rail ends: the last slide is reachable and there is no loop', async ({ page }) => {
        await page.goto('/');
        const track = page.locator('[data-rail-track]');
        await track.evaluate((el) => el.scrollTo({ left: el.scrollWidth, behavior: 'instant' }));
        await expect(counter(page)).toHaveText(/^(\d+) \/ \1$/);
        const total = Number((await counter(page).textContent())?.split(' / ')[1]);
        expect(await page.locator('[data-rail-track] > *').count()).toBe(total);
    });

    test('a project slide opens its project page', async ({ page }) => {
        await page.goto('/');
        const slide = page.locator('[data-rail-track] a[href^="/projects/"]').first();
        const href = await slide.getAttribute('href');
        expect(href).toMatch(/^\/projects\/[a-z0-9-]+$/);
        await slide.click();
        await expect(page).toHaveURL(new RegExp(`${href}$`));
    });

    test('the rail is a labelled region and the counter is polite', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('region', { name: 'Проекти' })).toBeVisible();
        await expect(counter(page)).toHaveAttribute('aria-live', 'polite');
    });

    test('the crew slide shows the computed years, never a hardcoded 25', async ({ page }) => {
        await page.goto('/');
        const year = new Date().getFullYear();
        await expect(page.locator('[data-rail-track] [data-crew-stat]').first()).toContainText(String(year - 1991));
        await expect(page.locator('[data-rail-track]')).not.toContainText(/\b25\b/);
    });

    test('english rail links keep the locale prefix', async ({ page }) => {
        await page.goto('/en');
        await expect(page.locator('[data-rail-track] a[href^="/en/projects/"]').first()).toBeVisible();
    });
});
