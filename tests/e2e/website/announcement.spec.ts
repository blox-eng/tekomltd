import { expect, test } from '@playwright/test';

// Values come from tests/fixtures/content: sale-block has one update with home: true and a button.

test('an update marked for the home page shows above the rail with its button', async ({ page }) => {
    await page.goto('/');
    const band = page.locator('[data-announcement]');
    await expect(band).toContainText('01.11.2026');
    await expect(band.getByRole('link', { name: 'Жилищна сграда „Пример“' })).toHaveAttribute('href', '/projects/sale-block');
    await expect(band).toContainText('Продажбите започнаха: три апартамента вече имат собственици.');
    await band.getByRole('link', { name: /Свободни апартаменти/ }).click();
    await expect(page).toHaveURL(/\/projects\/sale-block#apartamenti$/);
});

test('the button is translated and the text falls back to Bulgarian', async ({ page }) => {
    await page.goto('/en');
    const band = page.locator('[data-announcement]');
    await expect(band.getByRole('link', { name: /Available flats/ })).toHaveAttribute('href', '/en/projects/sale-block#apartamenti');
    await expect(band.locator('p[lang="bg"]')).toContainText('Продажбите започнаха');
});

test('the update keeps its button in the project log', async ({ page }) => {
    await page.goto('/projects/sale-block');
    await expect(page.locator('[data-progress] article').getByRole('link', { name: /Свободни апартаменти/ })).toBeVisible();
});
