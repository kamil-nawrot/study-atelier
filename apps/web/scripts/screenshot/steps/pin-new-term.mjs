import { openPinDialog } from './pin-new-symbol.mjs';

export default async function (page) {
	await openPinDialog(page);
	await page.getByRole('combobox', { name: 'Pojęcie ze Słowniczka' }).fill('Transept');
	await page.getByRole('option', { name: 'Dodaj pojęcie „Transept”' }).click();
	await page.getByRole('dialog', { name: 'Nowe pojęcie' }).waitFor();
	await page
		.getByRole('dialog', { name: 'Nowe pojęcie' })
		.getByRole('radio', { name: 'Architektura' })
		.click();
	await page.waitForTimeout(1500);
}
