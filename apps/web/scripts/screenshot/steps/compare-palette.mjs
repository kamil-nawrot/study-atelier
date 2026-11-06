export default async function (page) {
	await page.getByRole('button', { name: 'Paleta barw' }).click();
	await page.getByRole('list', { name: 'Paleta barw' }).first().waitFor();
}
