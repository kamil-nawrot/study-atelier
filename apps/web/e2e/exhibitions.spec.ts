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
	await page.getByLabel(m.exhibitions.nameLabel).fill('Portrety');
	await page.getByRole('dialog').getByRole('button', { name: m.exhibitions.add }).click();
	await page.waitForURL('**/atelier/exhibitions/*?edit');

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

	await page.getByRole('button', { name: m.exhibitions.view.done }).click();
	await page.waitForURL(/\/atelier\/exhibitions\/[^?]+$/);
	const heading = page.getByRole('heading', { name: 'Sala pierwsza' });
	await expect(heading).toBeVisible();
	const headingBox = await heading.boundingBox();
	const figureBox = await page.getByRole('figure').boundingBox();
	expect(headingBox && figureBox && headingBox.y < figureBox.y).toBe(true);
});
