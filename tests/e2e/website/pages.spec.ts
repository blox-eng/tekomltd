import { expect, test } from '@playwright/test';

// Values come from tests/fixtures/content.

test('a project without an English summary shows the Bulgarian text and the note under /en', async ({ page }) => {
    await page.goto('/en/projects/river-house');
    await expect(page.getByRole('heading', { level: 1, name: 'House by the river' })).toBeVisible();
    await expect(page.getByText('Description in Bulgarian. Translation to follow.')).toBeVisible();
    await expect(page.getByText('Двуетажна къща с градина', { exact: false })).toBeVisible();
});

test('a project without an English title shows the Bulgarian title and the note under /en', async ({ page }) => {
    await page.goto('/en/projects/stone-chapel');
    await expect(page.getByRole('heading', { level: 1, name: 'Параклис от камък' })).toBeVisible();
    await expect(page.getByText('Translation to follow').first()).toBeVisible();
});

test('a project without a year or area shows neither row, and never prints null', async ({ page }) => {
    await page.goto('/en/projects/town-flat');
    await expect(page.getByText('Completed')).toHaveCount(0);
    await expect(page.getByText('Built area')).toHaveCount(0);
    await expect(page.locator('main')).not.toContainText('null');
    await page.goto('/en/projects/river-house');
    await expect(page.getByText('Completed')).toBeVisible();
    await expect(page.getByText('Built area')).toBeVisible();
});

test('bg pages never show the translation note', async ({ page }) => {
    for (const path of ['/projects', '/projects/river-house', '/projects/stone-chapel', '/eu-programmes', '/publications', '/contact', '/about']) {
        await page.goto(path);
        await expect(page.getByText('Превод предстои')).toHaveCount(0);
        await expect(page.getByText('Translation to follow')).toHaveCount(0);
    }
});

test('the project detail links to the contact page and wraps to the next project', async ({ page }) => {
    await page.goto('/en/projects/river-house');
    await expect(page.getByRole('link', { name: /Planning something similar/ })).toHaveAttribute('href', '/en/contact');
    await expect(page.getByRole('link', { name: /^Next:/ })).toHaveAttribute('href', '/en/projects/stone-chapel');
    await page.goto('/en/projects/town-flat');
    await expect(page.getByRole('link', { name: /^Next:/ })).toHaveAttribute('href', '/en/projects/river-house');
});

test('the projects index lists every published project and never a draft', async ({ page }) => {
    await page.goto('/projects');
    const links = page.locator('main a[href^="/projects/"]');
    await expect(links).toHaveCount(3);
    await expect(page.locator('main a[href="/projects/secret-site"]')).toHaveCount(0);
    expect((await page.goto('/projects/secret-site'))?.status()).toBe(404);
});

test('contact shows phone, mailto e-mail and address, and has no form', async ({ page }) => {
    await page.goto('/contact');
    const main = page.locator('main');
    await expect(main.getByRole('link', { name: '+359 42 000 000' })).toHaveAttribute('href', 'tel:+35942000000');
    await expect(main.getByRole('link', { name: 'info@example.com' })).toHaveAttribute('href', 'mailto:info@example.com');
    await expect(main.getByText('ул. „Тестова“ № 1', { exact: false })).toBeVisible();
    await expect(page.locator('form')).toHaveCount(0);
});

test('the EU page shows the emblem, the statement and the programme figures', async ({ page }) => {
    await page.goto('/en/eu-programmes');
    await expect(page.getByText('Co-funded by the European Union').first()).toBeVisible();
    await expect(page.getByRole('img', { name: 'European Union flag' }).first()).toBeVisible();
    await expect(page.getByText('€120,000.50')).toBeVisible();
    await expect(page.getByText('€60,000.25')).toBeVisible();
    await page.goto('/eu-programmes');
    await expect(page.getByText('Съфинансирано от Европейския съюз').first()).toBeVisible();
});

test('publications are newest first and can be filtered by kind', async ({ page }) => {
    await page.goto('/publications');
    const dates = await page.locator('main li time').evaluateAll((els) => els.map((el) => el.getAttribute('datetime')!));
    expect(dates).toEqual(['2026-07-15', '2026-07-14', '2025-02-10', '2024-07-01']);
    await page.getByRole('button', { name: 'Други' }).click();
    await expect(page.locator('main li:visible')).toHaveCount(1);
    await page.getByRole('button', { name: 'Всички' }).click();
    await expect(page.locator('main li:visible')).toHaveCount(4);
});

test('a carried-over page renders under bg, and under /en with the note', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByRole('heading', { level: 1, name: 'За нас' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Екипът' })).toHaveAttribute('src', '/media/pages/about/team.jpg');
    await page.goto('/en/about');
    await expect(page.getByRole('heading', { level: 1, name: 'За нас' })).toBeVisible();
    await expect(page.getByText('Translation to follow')).toBeVisible();
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1, name: 'Политика за поверителност' })).toBeVisible();
});
