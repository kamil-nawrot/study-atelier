export default async function (page) {
	await page.getByRole('radio', { name: 'Symbol' }).click();
	await page.getByRole('searchbox', { name: 'Szukaj symbolu' }).fill('Kotwica');
	await page.getByRole('button', { name: 'Dodaj symbol „Kotwica”' }).click();
	await page.getByRole('alertdialog', { name: 'Nowy symbol' }).waitFor();
	await page.waitForTimeout(300);
}
