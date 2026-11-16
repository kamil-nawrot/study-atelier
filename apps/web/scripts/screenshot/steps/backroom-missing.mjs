export default async function (page) {
	await page.getByRole('tab', { name: 'Braki danych' }).click();
}
