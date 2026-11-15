import reachPair from './review-pair.mjs';

export default async function (page) {
	await reachPair(page);
	await page.getByRole('button', { name: /^Obraz 1$/ }).click();
	await page.waitForTimeout(600);
}
