import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Values come from tests/fixtures/content: sale-block (view: switch, floors 0–2, 8 units, a garage and a maisonette 7 on floors 1 and 2)
// and sale-tower (view: scroll, 2 floors). Their plans were made with pnpm blueprint.

const SALE = '/projects/sale-block';

test('the sales layout counts the units', async ({ page }) => {
    await page.goto(SALE);
    const totals = page.locator('[data-totals]');
    await expect(totals).toContainText('8 обекта · 3 свободни · 1 предстои · 1 резервиран · 3 продадени');
    await expect(totals).toContainText('свободни от 66 до 176 m² обща площ');
    await expect(totals).toContainText('наличност към 01.11.2026');
});

test('a tap on a floor shows its plan and a tap on a unit opens its page', async ({ page }) => {
    await page.goto(SALE);
    const elevation = page.getByRole('navigation', { name: 'Етажи' });
    await expect(elevation.getByRole('link')).toHaveText([/Етаж 2.*1 свободен/, /Етаж 1.*2 свободни/, /Партер.*1 свободен/]);
    await elevation.getByRole('link', { name: /Етаж 2/ }).click();
    await expect(page).toHaveURL(/#etazh-2$/);
    const plan = page.locator('#etazh-2');
    await expect(plan).toBeVisible();
    await expect(page.locator('#etazh-1')).toBeHidden();
    await expect(plan.getByRole('link', { name: /^Ап\. 7,/ })).toBeVisible();
    await page
        .locator('#etazh-2')
        .getByRole('link', { name: /^Ап\. 21,/ })
        .click();
    await expect(page).toHaveURL(/\/projects\/sale-block\/21$/);
});

test('without a hash the plan opens on the lowest floor with a free unit', async ({ page }) => {
    await page.goto(SALE);
    await expect(page.locator('#etazh-0')).toBeVisible();
    await expect(page.locator('#etazh-2')).toBeHidden();
});

test('each unit on the plan says what it is in words', async ({ page }) => {
    await page.goto(`${SALE}#etazh-1`);
    await expect(page.locator('#etazh-1').getByRole('link', { name: 'Ап. 12, етаж 1, 3 стаи, 88 m² обща площ, свободен' })).toBeVisible();
    await expect(page.locator('#etazh-1').getByText('продаден')).toBeVisible();
});

test('the keyboard reaches every floor and the units of the floor', async ({ page }) => {
    await page.goto(SALE);
    const floors = page.getByRole('navigation', { name: 'Етажи' }).getByRole('link');
    await floors.first().focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#etazh-2$/);
    const unit = page.locator('#etazh-2').getByRole('link', { name: /^Ап\. 22,/ });
    await unit.focus();
    await expect(unit).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/projects\/sale-block\/22$/);
});

test('the list of units filters, and says so when nothing is left', async ({ page }) => {
    await page.goto(SALE);
    const list = page.locator('[data-units]');
    await expect(list.locator('tbody tr')).toHaveCount(8);
    await list.getByLabel('само свободни').check();
    await expect(list.locator('tbody tr')).toHaveCount(3);
    await list.getByLabel('Вид').selectOption({ label: 'Гаражи' });
    await expect(list.locator('tbody tr')).toHaveCount(0);
    await expect(list).toContainText('Няма свободни обекти с тези филтри.');
    await list.getByLabel('само свободни').uncheck();
    await expect(list.locator('tbody tr')).toHaveCount(1);
    await expect(list.locator('tbody')).toContainText('Гараж G1');
});

test('the plan fits a phone without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${SALE}#etazh-1`);
    const box = await page.locator('#etazh-1 svg').boundingBox();
    expect(box!.width).toBeLessThanOrEqual(390);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('every floor plan and the whole list show', async ({ page }) => {
        await page.goto(SALE);
        for (const key of ['0', '1', '2']) await expect(page.locator(`#etazh-${key} svg`)).toBeVisible();
        await expect(page.locator('[data-units] tbody tr')).toHaveCount(8);
    });
});

test('the sales layout has no accessibility violations', async ({ page }) => {
    await page.goto(SALE);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
});

test('a big building scrolls floor by floor with a floor column', async ({ page }) => {
    await page.goto('/projects/sale-tower');
    const column = page.getByRole('navigation', { name: 'Етажи' });
    await expect(column.getByRole('link')).toHaveText(['Етаж 2', 'Етаж 1']);
    await expect(page.locator('#etazh-1')).toBeVisible();
    await expect(page.locator('#etazh-2')).toBeVisible();
    await page.locator('#etazh-1').scrollIntoViewIfNeeded();
    await page.evaluate(() => document.getElementById('etazh-1')!.scrollIntoView({ block: 'start' }));
    await expect(column.getByRole('link', { name: 'Етаж 1' })).toHaveAttribute('aria-current', 'true');
});

test('a project without units has no sales layout', async ({ page }) => {
    await page.goto('/projects/river-house');
    await expect(page.locator('#apartamenti')).toHaveCount(0);
    await page.goto('/projects/tower-rising');
    await expect(page.locator('#apartamenti')).toHaveCount(0);
});

const subjectOf = async (link: import('@playwright/test').Locator) => {
    const href = (await link.getAttribute('href'))!;
    expect(href.startsWith('mailto:info@example.com?')).toBe(true);
    return new URLSearchParams(href.split('?')[1]!.replace(/\+/g, '%2B'));
};

test('a free unit page shows its facts and asks about it by e-mail', async ({ page }) => {
    await page.goto(`${SALE}/12`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Ап. 12');
    const facts = page.locator('[data-unit-facts]');
    await expect(facts).toContainText('Обща площ88 m²');
    await expect(facts).toContainText('Чиста площ72 m²');
    await expect(facts).toContainText('Застроена площ81,6 m²');
    await expect(facts).toContainText('юг');
    await expect(facts).toContainText('свободен');
    const ask = page.getByRole('link', { name: 'Попитай за Ап. 12' });
    const query = await subjectOf(ask);
    expect(query.get('subject')).toBe('Запитване: Жилищна сграда „Пример“ · Ап. 12, ет. 1');
    expect(query.get('body')).toMatch(/\/projects\/sale-block\/12\nЗдравейте, интересувам се от Ап\. 12\.\n\n$/);
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(1);
});

test('the button follows the status of the unit', async ({ page }) => {
    await page.goto(`${SALE}/13`);
    await expect(page.getByRole('link', { name: 'Попитай дали се освобождава' })).toHaveAttribute('href', /^mailto:/);
    await page.goto(`${SALE}/21`);
    await expect(page.getByRole('link', { name: 'Запиши интерес' })).toHaveAttribute('href', /^mailto:/);
    await page.goto(`${SALE}/a3`);
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
    await expect(page.getByText('Този обект е продаден.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Виж свободните обекти' })).toHaveAttribute('href', `${SALE}#apartamenti`);
});

test('a unit address is lowercase only', async ({ page }) => {
    expect((await page.goto(`${SALE}/a3`))?.status()).toBe(200);
    expect((await page.goto(`${SALE}/A3`))?.status()).toBe(404);
    expect((await page.goto(`${SALE}/99`))?.status()).toBe(404);
});

test('a maisonette lists both floors and draws both plans', async ({ page }) => {
    await page.goto(`${SALE}/7`);
    await expect(page.locator('[data-unit-facts]')).toContainText('Етаж 1, Етаж 2');
    await expect(page.locator('[data-unit-plan]')).toHaveCount(2);
});

test('the unit page links to its neighbours and back to its floor', async ({ page }) => {
    await page.goto(`${SALE}/13`);
    await expect(page.getByRole('link', { name: /Ап\. 12/ }).first()).toHaveAttribute('href', `${SALE}/12`);
    await expect(page.getByRole('link', { name: /Ап\. A3/ }).first()).toHaveAttribute('href', `${SALE}/a3`);
    await expect(page.getByRole('link', { name: 'Към Етаж 1' })).toHaveAttribute('href', `${SALE}#etazh-1`);
});

test('the English unit page asks in English', async ({ page }) => {
    await page.goto(`/en${SALE}/12`);
    const query = await subjectOf(page.getByRole('link', { name: 'Ask about Apt. 12' }));
    expect(query.get('subject')).toBe('Enquiry: Example block · Apt. 12, fl. 1');
});

test('the sitemap lists every unit page', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).toContain('/projects/sale-block/12</loc>');
    expect(xml).toContain('/projects/sale-block/a3</loc>');
});

test('the unit page has no accessibility violations', async ({ page }) => {
    await page.goto(`${SALE}/12`);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations).toEqual([]);
});
