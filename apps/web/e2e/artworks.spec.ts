import { m } from '#lib/i18n/i18n.ts';
import { expect, signIn, test } from './fixtures.ts';

test('adds an artwork, opens it, moves it to the archive and restores it', async ({
	page,
	learner
}) => {
	await signIn(page, learner);

	await page.getByRole('link', { name: m.atelier.add }).first().click();
	await page.getByLabel(m.artworkForm.title).fill('Dama z gronostajem');
	await page.getByLabel(m.artworkForm.authorUnknown).check();
	await page.getByRole('button', { name: m.common.save, exact: true }).click();

	await page.waitForURL('**/atelier');
	await page
		.getByRole('link', { name: /Dama z gronostajem/ })
		.first()
		.click();
	await expect(page.getByRole('heading', { name: 'Dama z gronostajem' })).toBeVisible();

	await page.getByRole('button', { name: m.common.delete }).click();
	await page.getByRole('button', { name: m.trash.move }).click();
	await page.waitForURL('**/atelier');
	await expect(page.getByRole('link', { name: /Dama z gronostajem/ })).toHaveCount(0);

	await page.goto('/atelier/trash');
	await page.getByRole('button', { name: m.trash.restore }).click();
	await expect(page.getByText(m.trash.restored('#0001'))).toBeVisible();

	await page.goto('/atelier');
	await expect(page.getByRole('link', { name: /Dama z gronostajem/ }).first()).toBeVisible();
});
