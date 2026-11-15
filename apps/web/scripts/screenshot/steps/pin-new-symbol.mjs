export async function openPinDialog(page) {
	await page.getByRole('button', { name: 'Dodaj pinezkę w tym miejscu' }).first().click();
	await page.getByRole('dialog', { name: 'Nowa pinezka' }).waitFor();
}

export default async function (page) {
	await openPinDialog(page);
	await page.getByRole('combobox', { name: 'Symbol z atlasu' }).fill('Kotwica');
	await page.getByRole('option', { name: 'Dodaj symbol „Kotwica”' }).click();
	await page.getByRole('alertdialog', { name: 'Nowy symbol' }).waitFor();
	await page.getByLabel('Znaczenie', { exact: true }).fill('nadzieja');
	await page.waitForTimeout(300);
}
