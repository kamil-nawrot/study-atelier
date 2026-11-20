import { openPinDialog } from './pin-new-symbol.mjs';

export default async function (page) {
	await openPinDialog(page);
	await page.getByRole('combobox', { name: 'Pojęcie lub postać ze Słowniczka' }).fill('Dionizos');
	await page.getByRole('option', { name: 'Dodaj postać „Dionizos”' }).click();
	await page.getByRole('dialog', { name: 'Nowa postać' }).waitFor();
	await page
		.getByRole('dialog', { name: 'Nowa postać' })
		.getByRole('radio', { name: 'Bóstwo i postać mitu' })
		.click();
	await page.waitForTimeout(1500);
}
