import { openPinDialog } from './pin-new-symbol.mjs';

export default async function (page) {
	await openPinDialog(page);
	await page.getByRole('combobox', { name: 'Pojęcie lub postać ze Słowniczka' }).fill('Dionizos');
	await page.getByRole('option', { name: 'Dodaj postać „Dionizos”' }).waitFor();
}
