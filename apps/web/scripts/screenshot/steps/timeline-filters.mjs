export default async function (page) {
	await page.getByRole('button', { name: 'Filtry' }).first().click();
	await page
		.getByText(/każdy z nich dostanie na osi własny wiersz/)
		.first()
		.waitFor();
}
