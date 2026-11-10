export default async function (page) {
	await page.getByRole('button', { name: /^Wojna trzydziestoletnia/ }).click();
	await page.getByRole('heading', { name: 'Wojna trzydziestoletnia', level: 2 }).waitFor();
}
