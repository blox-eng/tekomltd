import { expect, test } from '@playwright/test';

// Values come from tests/fixtures/content: tower-rising is in progress, old-mill-facade is finished with a log.

test('a project in progress comes first on /projects and says so on its tile', async ({ page }) => {
    await page.goto('/projects');
    const first = page.locator('main li:has(h3)').first();
    await expect(first).toContainText('Жилищна сграда „Кула“');
    await expect(first).toContainText('в строеж');
});

test('the page of a project in progress shows its stages, quarter, permit, note and updates', async ({ page }) => {
    await page.goto('/en/projects/tower-rising');
    const progress = page.locator('[data-progress]');
    const stages = progress.getByRole('list', { name: 'Stages' }).getByRole('listitem');
    await expect(stages).toHaveCount(8);
    await expect(stages.nth(1)).toContainText('Archaeological survey');
    await expect(stages.nth(2)).toContainText('under way');
    await expect(progress.getByText('under way')).toHaveCount(1);
    await expect(progress).toContainText('Q1 2028');
    await expect(progress).toContainText('РС № 1/2026, Община Стара Загора');
    await expect(progress).toContainText('Work goes on as planned.');
    await expect(progress).toContainText('last update: 01.11.2026');
    const dates = await progress.locator('article time').evaluateAll((els) => els.map((el) => el.getAttribute('datetime')));
    expect(dates).toEqual(['2026-11-01', '2026-10-01']);
    await expect(page.getByText('→ today')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Interested in a flat/ })).toHaveAttribute('href', '/en/contact');
});

test('a finished project keeps its log and shows its age instead of the label', async ({ page }) => {
    await page.goto('/en/projects/old-mill-facade');
    await expect(page.getByText('2025 → today')).toBeVisible();
    await expect(page.locator('[data-progress]')).toContainText('we handed the facade over');
    await expect(page.getByText('in progress', { exact: true })).toHaveCount(0);
});

test('a finished project without a progress block shows none of it', async ({ page }) => {
    await page.goto('/en/projects/river-house');
    await expect(page.locator('[data-progress]')).toHaveCount(0);
});

test('the service table says in progress instead of a year', async ({ page }) => {
    await page.goto('/fasadi');
    await expect(page.locator('main table tr', { hasText: 'Жилищна сграда „Кула“' })).toContainText('в строеж');
});

test('the page of a project in progress fits a phone and its photos take the keyboard', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/projects/tower-rising');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    const photo = page.locator('[data-progress] article a').first();
    await photo.focus();
    await expect(photo).toBeFocused();
});

test('a finished project hides the expected quarter, the note and an empty log', async ({ page }) => {
    await page.goto('/en/projects/quiet-wall');
    const progress = page.locator('[data-progress]');
    await expect(progress.getByRole('list', { name: 'Stages' }).getByRole('listitem')).toHaveCount(5);
    await expect(progress).not.toContainText('Q2 2023');
    await expect(progress).not.toContainText('The dates are under review.');
    await expect(progress).not.toContainText('the first update is coming');
    await expect(progress).not.toContainText('Site log');
});

test('a house in progress shows its default stages and waits for its first update', async ({ page }) => {
    await page.goto('/en/projects/hill-house');
    const progress = page.locator('[data-progress]');
    await expect(progress.getByRole('list', { name: 'Stages' }).getByRole('listitem')).toHaveCount(7);
    await expect(progress).toContainText('Occupancy certificate');
    await expect(progress).toContainText('the first update is coming');
});

test('an English log in Bulgarian says so', async ({ page }) => {
    await page.goto('/en/projects/tower-rising');
    await expect(page.locator('[data-progress]')).toContainText('Description in Bulgarian. Translation to follow.');
    await page.goto('/en/projects/old-mill-facade');
    await expect(page.locator('[data-progress]')).not.toContainText('Translation to follow');
});

test('a screen reader hears what each stage date means', async ({ page }) => {
    await page.goto('/en/projects/tower-rising');
    const stages = page.locator('[data-progress]').getByRole('list', { name: 'Stages' }).getByRole('listitem');
    await expect(stages.first()).toContainText('done on 20.05.2026');
    await expect(stages.nth(3)).toContainText('not started');
});

test('a project in progress without a photo shows the drawing and the stamp instead', async ({ page }) => {
    await page.goto('/en/projects');
    const tile = page.locator('main li:has(h3)', { hasText: 'House on the hill' });
    await expect(tile.getByRole('img', { name: 'Design to come' })).toBeVisible();
    await expect(tile.locator('img')).toHaveCount(0);
    await page.goto('/en/projects/hill-house');
    await expect(page.getByRole('img', { name: 'Design to come' })).toBeVisible();
    await page.getByRole('img', { name: 'Design to come' }).hover();
    await expect(page.locator('[data-pending] .stamp')).toHaveCSS('opacity', '1');
});
