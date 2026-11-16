export default async function (page) {
	await page.getByRole('link', { name: 'Poprawiaj po kolei' }).click();
	await page.getByRole('button', { name: 'Zapisz i dalej' }).waitFor();
	await page.waitForTimeout(800);
}
