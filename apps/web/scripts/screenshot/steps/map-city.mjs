export default async function (page) {
	await page.getByRole('button', { name: /^Paryż/ }).click();
	await page.getByRole('heading', { name: 'Paryż' }).waitFor();
}
