import { reachQuestion } from './review-until.mjs';

export default async function (page) {
	await reachQuestion(page, 'Jaki tytuł nosi to dzieło sztuki?');
	await page.keyboard.press('2');
	await page.waitForTimeout(400);
}
