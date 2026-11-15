import { reachQuestion } from './review-until.mjs';

export default async function (page) {
	await reachQuestion(page, 'W jakiej kolejności powstały te dzieła?');
	const tiles = page.getByRole('button', { name: /^Obraz \d$/ });
	if (await tiles.first().isVisible()) {
		await tiles.first().click();
		await tiles.first().click();
	}
	await page.waitForTimeout(300);
}
