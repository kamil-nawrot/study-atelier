export default async function (page) {
	await page.getByRole('radio', { name: 'Symbol' }).click();
	await page.getByRole('searchbox', { name: 'Szukaj symbolu' }).fill('Kotwica');
	await page.waitForTimeout(300);
}
