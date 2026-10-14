import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 900 } });

test.describe('landing page', () => {
    test('has exactly one h1', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('h1')).toHaveCount(1);
    });

    test('the partner services section is the footer Services target', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('section#services')).toHaveCount(1);
    });

    test('the stats are formatted per locale', async ({ page }) => {
        const numbers = async (path: string) => page.goto(path).then(() => page.locator('[data-stat] b').allTextContents());
        expect((await numbers('/'))[1]).toBe('24 000');
        expect((await numbers('/en'))[1]).toBe('24,000');
        expect((await numbers('/de'))[1]).toBe('24.000');
    });

    test('the unconfirmed stat carries an asterisk', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('[data-stat] b').last()).toHaveText('1*');
    });

    test('the crews heading shows a dotted turning phrase that changes within 4 s', async ({ page }) => {
        await page.goto('/en');
        const turn = page.locator('section[data-crews] h2 .turn');
        await turn.scrollIntoViewIfNeeded();
        await expect(turn).toContainText('the plaster');
        await expect(turn).not.toContainText('the plaster', { timeout: 4500 });
        expect(await turn.evaluate((el) => getComputedStyle(el).textDecorationStyle)).toBe('dotted');
    });

    test('a hover on a crew role turns the matching scene glyph to the accent colour', async ({ page }) => {
        await page.goto('/en');
        const icon = page.locator('svg g[data-tool="plumb"]');
        const before = await icon.evaluate((el) => getComputedStyle(el).stroke);
        await page.locator('li[data-tool="plumb"]').hover();
        const accent = await page.evaluate(() => {
            const probe = document.createElement('i');
            probe.style.color = 'var(--accent)';
            document.body.append(probe);
            return getComputedStyle(probe).color;
        });
        await expect.poll(() => icon.evaluate((el) => getComputedStyle(el).stroke)).toBe(accent);
        expect(before).not.toBe(accent);
    });

    test('the partners section is absent when no partner exists', async ({ page }) => {
        await page.goto('/en');
        await expect(page.locator('[data-partners]')).toHaveCount(0);
        await expect(page.locator('[data-materials]')).toHaveCount(1);
    });

    test('a click on a map pin opens the project page', async ({ page }) => {
        await page.goto('/en');
        const pin = page.locator('[data-map] a[aria-label]').first();
        await pin.scrollIntoViewIfNeeded();
        const href = await pin.getAttribute('href');
        expect(href).toMatch(/^\/en\/projects\/[a-z0-9-]+$/);
        await pin.dispatchEvent('click');
        await expect(page).toHaveURL(new RegExp(`${href}$`));
    });
});

test.describe('landing page, reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('the turning phrase does not change', async ({ page }) => {
        await page.goto('/en');
        const turn = page.locator('section[data-crews] h2 .turn');
        await turn.scrollIntoViewIfNeeded();
        await page.waitForTimeout(4500);
        await expect(turn).toContainText('the plaster');
    });
});
