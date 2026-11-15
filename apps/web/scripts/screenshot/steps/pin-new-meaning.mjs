import { openPinDialog } from './pin-new-symbol.mjs';

export default async function (page) {
	await openPinDialog(page);
	await page.getByRole('combobox', { name: 'Symbol z atlasu' }).fill('Lilia');
	await page.getByRole('option', { name: 'Lilia' }).click();
	await page.getByRole('combobox', { name: 'Znaczenie na tym dziele' }).fill('zmartwychwstanie');
	await page.waitForTimeout(300);
}
