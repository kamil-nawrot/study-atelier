export default async function (page) {
	await page.getByRole('button', { name: 'Zmień położenie' }).waitFor();
}
