import { expect, test } from '@playwright/test';

test('a project without an English summary shows the Bulgarian text and the note under /en', async ({ page }) => {
    await page.goto('/en/projects/art-gallery-centre');
    await expect(page.getByRole('heading', { level: 1, name: 'Office and retail centre with art gallery' })).toBeVisible();
    await expect(page.getByText('Description in Bulgarian. Translation to follow.')).toBeVisible();
    await expect(page.getByText('Обектът се намира', { exact: false })).toBeVisible();
});

test('a project without a year shows no Completed row, and never prints null', async ({ page }) => {
    await page.goto('/en/projects/gladstone-44');
    await expect(page.getByText('Built area')).toBeVisible();
    await expect(page.getByText('Completed')).toHaveCount(0);
    await expect(page.locator('main')).not.toContainText('null');
    await page.goto('/en/projects/art-gallery-centre');
    await expect(page.getByText('Completed')).toBeVisible();
});

test('bg pages never show the translation note', async ({ page }) => {
    for (const path of ['/projects', '/projects/art-gallery-centre', '/eu-programmes', '/publications', '/contact', '/about']) {
        await page.goto(path);
        await expect(page.getByText('Превод предстои')).toHaveCount(0);
        await expect(page.getByText('Translation to follow')).toHaveCount(0);
    }
});

test('the project detail links to the contact page and wraps to the next project', async ({ page }) => {
    await page.goto('/en/projects/zheleznik-pool');
    await expect(page.getByRole('link', { name: /Planning something similar/ })).toHaveAttribute('href', '/en/contact');
    await expect(page.getByRole('link', { name: /^Next:/ })).toHaveAttribute('href', /^\/en\/projects\/[a-z0-9-]+$/);
});

test('the projects index lists every project', async ({ page }) => {
    await page.goto('/projects');
    await expect(page.locator('main a[href^="/projects/"]')).toHaveCount(17);
});

test('contact shows phone, mailto e-mail and address, and has no form', async ({ page }) => {
    await page.goto('/contact');
    const main = page.locator('main');
    await expect(main.getByRole('link', { name: '+359 88 506 9099' })).toHaveAttribute('href', 'tel:+359885069099');
    await expect(main.getByRole('link', { name: 'info@tekomltd.com' })).toHaveAttribute('href', 'mailto:info@tekomltd.com');
    await expect(main.getByText('Хаджи Димитър Асенов', { exact: false })).toBeVisible();
    await expect(page.locator('form')).toHaveCount(0);
});

test('the EU page shows the emblem, the statement and the programme figures', async ({ page }) => {
    await page.goto('/en/eu-programmes');
    await expect(page.getByText('Co-funded by the European Union').first()).toBeVisible();
    await expect(page.getByRole('img', { name: 'European Union flag' }).first()).toBeVisible();
    await expect(page.getByText('€175,569.98')).toBeVisible();
    await expect(page.getByText('€149,234.48')).toBeVisible();
    await page.goto('/eu-programmes');
    await expect(page.getByText('Съфинансирано от Европейския съюз').first()).toBeVisible();
});

test('publications are newest first and can be filtered by kind', async ({ page }) => {
    await page.goto('/publications');
    const dates = await page.locator('main li time').evaluateAll((els) => els.map((el) => el.getAttribute('datetime')!));
    expect(dates.length).toBeGreaterThan(10);
    expect([...dates].sort().reverse()).toEqual(dates);
    const all = dates.length;
    await page.getByRole('button', { name: 'Други' }).click();
    await expect(page.locator('main li:visible')).toHaveCount(6);
    await page.getByRole('button', { name: 'Всички' }).click();
    await expect(page.locator('main li:visible')).toHaveCount(all);
});

test('a carried-over page renders under bg, and under /en with the note', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1, name: 'За нас' })).toBeVisible();
    await page.goto('/en/about');
    await expect(page.getByRole('heading', { level: 1, name: 'За нас' })).toBeVisible();
    await expect(page.getByText('Translation to follow')).toBeVisible();
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
