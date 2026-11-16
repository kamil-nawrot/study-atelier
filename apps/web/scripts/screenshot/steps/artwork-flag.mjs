export default async function (page) {
	const more = page.getByRole('button', { name: 'Więcej działań' });
	if (await more.isVisible()) {
		await more.click();
		await page.getByRole('button', { name: 'Do poprawki' }).click();
	} else {
		await page.getByRole('button', { name: 'Do poprawki' }).click();
	}
	await page.getByRole('radio', { name: 'Pinezka wskazuje złe miejsce albo zły detal' }).click();
}
