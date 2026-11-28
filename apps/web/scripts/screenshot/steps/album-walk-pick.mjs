export default async function (page) {
	await page.getByRole('button', { name: 'Mam je już w atelier' }).click();
	await page.getByRole('heading', { name: /^Które dzieło z atelier to/ }).waitFor();
	await page.locator('.picker li a').first().waitFor();
}
