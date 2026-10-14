import { expect, test, type Locator, type Page } from '@playwright/test';

// Values come from tests/fixtures/content: river-house has a cover and one gallery photo (garden.jpg, focus: bottom).

const WIDTHS = [
    { name: 'phone', width: 390, height: 844 },
    { name: 'desktop', width: 1440, height: 900 }
];

async function expectSquare(images: Locator) {
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
        const image = images.nth(i);
        await image.scrollIntoViewIfNeeded();
        await expect(image).toHaveJSProperty('complete', true);
        const box = (await image.boundingBox())!;
        expect(box.width).toBeGreaterThan(100);
        expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(1);
        await expect(image).toHaveCSS('object-fit', 'cover');
        expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    }
}

const fileOf = async (page: Page, href: string) => {
    const response = await page.request.get(href);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toMatch(/^image\//);
};

for (const { name, width, height } of WIDTHS) {
    test.describe(`at ${name} width`, () => {
        test.use({ viewport: { width, height } });

        test('the landing rail shows square project photos', async ({ page }) => {
            await page.goto('/');
            const photos = page.locator('[data-rail-track] a[href^="/projects/"] img');
            await expectSquare(photos);
        });

        test('the projects grid shows square thumbnails that are cropped, never stretched', async ({ page }) => {
            await page.goto('/projects');
            await expectSquare(page.locator('main ul li img'));
        });

        test('the project gallery shows square thumbnails and keeps the chosen focus', async ({ page }) => {
            await page.goto('/en/projects/river-house');
            const thumbs = page.locator('main ul li img');
            await expect(thumbs).toHaveCount(1);
            await expectSquare(thumbs);
            await expect(thumbs.first()).toHaveCSS('object-position', '50% 100%');
            await expect(thumbs.first()).toHaveAttribute('alt', /.+/);
        });
    });
}

test('a gallery thumbnail opens the full photo from the keyboard', async ({ page }) => {
    await page.goto('/en/projects/river-house');
    const link = page.getByRole('link', { name: /^Full photo: / }).last();
    const href = (await link.getAttribute('href'))!;
    expect(href).toBe('/media/projects/river-house/garden.jpg');
    await fileOf(page, href);
    await link.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/media\/projects\/river-house\/garden\.jpg$/);
});

test('a grid thumbnail leads to the project, whose cover opens the full photo', async ({ page }) => {
    await page.goto('/en/projects');
    await page.locator('main a[href="/en/projects/river-house"]').click();
    const cover = page.getByRole('link', { name: 'Full photo: The front of the house' });
    await expect(cover).toHaveAttribute('href', '/media/projects/river-house/front.jpg');
    await fileOf(page, '/media/projects/river-house/front.jpg');
});
