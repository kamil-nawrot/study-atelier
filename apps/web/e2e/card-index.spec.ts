import { m } from '#lib/i18n/i18n.ts';
import { expect, signIn, test } from './fixtures.ts';

test('adds an author in the card index and suggests it in the artwork form', async ({
	page,
	learner
}) => {
	await signIn(page, learner);

	await page.goto('/atelier/values');
	await page.getByRole('tab', { name: m.cardIndex.tabs.author }).click();
	await page.getByRole('link', { name: m.cardIndex.add.author }).click();
	await page.getByLabel(m.common.name).fill('Leonardo da Vinci');
	await page.getByRole('button', { name: m.common.save, exact: true }).click();

	await expect(page.getByRole('heading', { name: 'Leonardo da Vinci' })).toBeVisible();

	await page.goto('/atelier/new');
	await page.getByRole('combobox', { name: m.artworkForm.authors }).fill('Leon');
	await expect(page.getByRole('option', { name: 'Leonardo da Vinci' })).toBeVisible();
});
