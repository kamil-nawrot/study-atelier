import { m } from '#lib/i18n/i18n.ts';
import { expect, signIn, test } from './fixtures.ts';

test('builds an exhibition from blocks that typing or dragging cannot break', async ({
	page,
	learner
}) => {
	await signIn(page, learner);
	await page.getByRole('link', { name: m.atelier.add }).first().click();
	await page.getByLabel(m.artworkForm.title).fill('Dama z gronostajem');
	await page.getByLabel(m.artworkForm.authorUnknown).check();
	await page.getByRole('button', { name: m.common.save, exact: true }).click();
	await page.waitForURL('**/atelier');

	await page.goto('/atelier/exhibitions');
	await page.getByRole('button', { name: m.exhibitions.add }).click();
	const name = page.getByLabel(m.exhibitions.nameLabel);
	await name.fill('Portrety');
	await name.press('Enter');
	await page.waitForURL(/\/atelier\/exhibitions\/[^/?]+\?edit$/);

	await page.getByRole('button', { name: 'Dama z gronostajem' }).click();
	const figure = page.getByRole('figure');
	await expect(figure).toBeVisible();

	await page.getByRole('button', { name: m.exhibitions.panel.paragraph }).click();
	const text = page.getByRole('textbox', { name: m.exhibitions.blocks.textBlock });
	await expect(text).toBeFocused();
	await text.fill('Gronostaj był symbolem czystości.');
	await text.fill('');
	await page
		.locator('[data-kind="textBlock"]')
		.getByRole('button', { name: m.exhibitions.bar.remove })
		.click();
	await expect(text).toHaveCount(0);
	await expect(figure).toBeVisible();

	await page.getByRole('button', { name: m.exhibitions.panel.heading, exact: true }).click();
	await page.getByRole('textbox', { name: m.exhibitions.blocks.heading }).fill('Sala pierwsza');
	const handle = page.locator('[data-kind="heading"] .handle');
	const from = await handle.boundingBox();
	if (!from) throw new Error('the heading has no handle on screen');
	await page.mouse.move(from.x + 10, from.y + 10);
	await page.mouse.down();
	await page.mouse.move(from.x + 30, from.y + 30, { steps: 4 });
	await page.mouse.move(from.x + 30, 90, { steps: 8 });
	await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
	const title = await page
		.getByRole('textbox', { name: m.exhibitions.view.titleLabel })
		.boundingBox();
	if (!title) throw new Error('the title is not on screen');
	await page.mouse.move(from.x + 30, title.y + title.height + 4, { steps: 4 });
	await page.mouse.up();

	await page.getByRole('radiogroup').getByText(m.exhibitions.blocks.palette).click();
	await page.getByRole('button', { name: 'Dama z gronostajem' }).click();
	await expect(page.getByText(m.exhibitions.limits.noImage)).toBeVisible();
	await expect(page.locator('[data-kind="palette"]')).toHaveCount(0);

	await page.getByRole('button', { name: m.exhibitions.panel.quote }).click();
	await page
		.getByRole('textbox', { name: m.exhibitions.blocks.quote })
		.fill('Dama trzyma zwierzę jak herb.');
	const quote = page.locator('[data-kind="quote"]');
	await quote.evaluate((element) =>
		window.scrollBy(0, element.getBoundingClientRect().top - window.innerHeight / 2)
	);
	await quote.hover({ position: { x: 100, y: 40 } });
	const grip = await quote.locator('.handle').boundingBox();
	if (!grip) throw new Error('the quote has no handle on screen');
	await page.mouse.move(grip.x + 10, grip.y + grip.height - 10);
	await page.mouse.down();
	await page.mouse.move(grip.x + 30, 360, { steps: 4 });
	let settled = -1;
	await expect
		.poll(async () => {
			const now = await page.evaluate(() => window.scrollY);
			const still = now === settled;
			settled = now;
			return still;
		})
		.toBe(true);
	const artwork = await page.locator('[data-kind="artwork"]').boundingBox();
	if (!artwork) throw new Error('the artwork is not on screen');
	const inside = Math.max(artwork.y + 20, Math.min(artwork.y + artwork.height - 20, 360));
	await page.mouse.move(artwork.x + artwork.width - 10, inside, { steps: 8 });
	await expect(page.locator('.mark[data-side]')).toBeVisible();
	await page.mouse.up();
	const row = page.locator('[data-row-id]').filter({ has: page.locator('[data-kind="artwork"]') });
	await expect(row.locator('[data-kind="quote"]')).toHaveCount(1);

	await page.getByRole('button', { name: m.exhibitions.view.done }).click();
	await page.waitForURL(/\/atelier\/exhibitions\/[^?]+$/);
	const heading = page.getByRole('heading', { name: 'Sala pierwsza' });
	await expect(heading).toBeVisible();
	const headingBox = await heading.boundingBox();
	const figures = page.getByRole('figure');
	await expect(figures).toHaveCount(1);
	const figureBox = await figures.first().boundingBox();
	const quoteBox = await page.locator('blockquote').boundingBox();
	expect(headingBox && figureBox && headingBox.y < figureBox.y).toBe(true);
	expect(figureBox && quoteBox && figureBox.x < quoteBox.x).toBe(true);
	expect(figureBox && quoteBox && Math.abs(figureBox.y - quoteBox.y) < 2).toBe(true);
});
