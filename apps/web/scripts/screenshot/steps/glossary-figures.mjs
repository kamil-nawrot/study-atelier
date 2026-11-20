export default async function (page) {
	await page.getByRole('tab', { name: 'Postaci' }).click();
	await page.getByRole('link', { name: /^Zeus/ }).waitFor();
}
