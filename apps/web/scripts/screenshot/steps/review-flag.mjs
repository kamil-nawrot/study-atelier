export default async function (page) {
	await page.getByRole('button', { name: 'Zacznij powtórkę' }).click();
	await page.getByRole('button', { name: 'Do poprawki' }).click();
	await page.getByRole('radio', { name: 'Coś się nie zgadza w danych' }).click();
}
