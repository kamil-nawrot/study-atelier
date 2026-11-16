export default async function (page) {
	const more = page.getByRole('button', { name: 'Więcej działań' });
	if (await more.isVisible()) await more.click();
	await page.getByRole('button', { name: /^Do poprawki, oznaczone/ }).click();
	await page.getByRole('radio', { name: /^Coś innego/ }).click();
}
