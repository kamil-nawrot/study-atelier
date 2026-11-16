export default async function (page) {
	await page.getByRole('button', { name: 'Zacznij powtórkę' }).click();
	await page.getByRole('button', { name: /^Do poprawki/ }).click();
	await page.getByRole('radio', { name: /^Obraz jest nieostry albo zły/ }).click();
}
