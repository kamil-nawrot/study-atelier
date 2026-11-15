export default async function (page) {
	await page.getByRole('button', { name: 'Zmień afisz' }).click();
	await page.getByRole('dialog', { name: 'Afisz wystawy' }).waitFor();
	await page.waitForTimeout(800);
}
