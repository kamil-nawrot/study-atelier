import pick from './album-walk-pick.mjs';

export default async function (page) {
	await pick(page);
	await page.locator('.picker li a').first().click();
	await page.getByText('Zaznacz, co ma trafić do Twojego dzieła.').waitFor();
}
