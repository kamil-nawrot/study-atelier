import { reachQuestion } from './review-until.mjs';

export default async function (page) {
	await reachQuestion(page, 'Jakiego pojęcia brakuje w Twojej notatce?');
	await page.keyboard.press('1');
}
