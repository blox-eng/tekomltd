import { expect, test } from '@playwright/test';

// Values come from tests/fixtures/content: four projects in progress, 2025, 2024, 2023, 2019, and town-flat without a year.

test('the projects index groups projects by year under a year column', async ({ page }) => {
    await page.goto('/en/projects');
    const years = page.getByRole('navigation', { name: 'Years' }).getByRole('link');
    await expect(years).toHaveText(['today', '2025', '2024', '2023', '2019', 'no year']);
    const groups = page.locator('main section[id^="y-"]');
    await expect(groups.locator('h2')).toHaveText(['today', '2025', '2024', '2023', '2019', 'no year']);
    await expect(page.locator('#y-2019')).toContainText('Параклис от камък');
    await expect(page.locator('#y-none')).toContainText('Flat in the centre');
    await expect(page.locator('#y-now li:has(h3)')).toHaveCount(4);
});

test('a year link jumps to its group and is marked as the year in view', async ({ page }) => {
    await page.goto('/en/projects');
    const link = page.getByRole('navigation', { name: 'Years' }).getByRole('link', { name: '2019' });
    await link.click();
    await expect(page).toHaveURL(/#y-2019$/);
    await expect(page.locator('#y-2019')).toBeInViewport();
    await expect(link).toHaveAttribute('aria-current', 'true');
});

test('the year row fits a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/projects');
    await expect(page.getByRole('navigation', { name: 'Години' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

// #58: a page-wide scroll snap pulled the page back to the nearest year group while the reader scrolled.
test('the projects index scrolls where the wheel sends it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 400 });
    await page.goto('/en/projects');
    await page.mouse.move(640, 200);
    const target = Math.min(1200, await page.evaluate(() => document.documentElement.scrollHeight - innerHeight));
    for (let y = 0; y < target; y += 100) {
        await page.mouse.wheel(0, 100);
        await page.waitForTimeout(30);
    }
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => Math.round(scrollY))).toBe(target);
});

test('on a phone the year row follows the scroll and leaves the page alone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 500 });
    await page.goto('/en/projects');
    await page.mouse.move(195, 300);
    const target = await page.evaluate(() => {
        const y = Math.round(document.getElementById('y-2019')!.getBoundingClientRect().top / 100) * 100;
        return Math.min(y, document.documentElement.scrollHeight - innerHeight);
    });
    for (let y = 0; y < target; y += 100) {
        await page.mouse.wheel(0, 100);
        await page.waitForTimeout(30);
    }
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => Math.round(scrollY))).toBe(target);
    const current = page.getByRole('navigation', { name: 'Years' }).locator('[aria-current]');
    await expect(current).not.toHaveText('today');
    await expect(current).toBeInViewport({ ratio: 1 });
});
