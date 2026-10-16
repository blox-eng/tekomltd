import { expect, test } from '@playwright/test';

// DESIGN.md §2: Bulgarian letterforms in headings only, project names in the display face.
const style = (locator: import('@playwright/test').Locator, property: string) =>
    locator.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);

test('running text and buttons ask for standard Cyrillic, headings keep the Bulgarian forms', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('html')).toHaveAttribute('lang', 'bg');
    expect(await style(page.locator('.site-nav a').first(), 'font-language-override')).toBe('"RUS"');
    expect(await style(page.locator('h1'), 'font-language-override')).toBe('normal');
    expect(await style(page.locator('main h3').first(), 'font-language-override')).toBe('normal');
});

test('project names are set in the display face', async ({ page }) => {
    await page.goto('/projects');
    expect(await style(page.locator('main h3').first(), 'font-family')).toMatch(/Cormorant/);
});
