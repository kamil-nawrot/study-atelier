import reachRelation from './review-relation.mjs';

export default async function (page) {
	await reachRelation(page);
	await page.keyboard.press('2');
	await page.waitForTimeout(600);
}
