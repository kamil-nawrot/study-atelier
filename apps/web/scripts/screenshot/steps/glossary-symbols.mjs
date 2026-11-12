export default async function (page) {
	await page.getByRole('tab', { name: 'Symbole' }).click();
	await page.getByRole('searchbox', { name: 'Szukaj symbolu' }).waitFor();
}
