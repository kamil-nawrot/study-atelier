export default async function (page) {
	await page.getByRole('button', { name: 'Uzupełnij położenie' }).click();
	await page.getByRole('button', { name: /Museum of Modern Art/ }).click();
}
