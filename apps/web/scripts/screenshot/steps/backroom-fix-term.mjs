export default async function (page) {
	await page.getByRole('link', { name: 'Popraw', exact: true }).nth(1).click();
	await page.getByRole('button', { name: 'Zapisz' }).waitFor();
	await page.waitForTimeout(800);
}
