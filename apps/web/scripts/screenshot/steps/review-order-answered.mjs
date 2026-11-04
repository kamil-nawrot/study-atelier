import { reachQuestion } from './review-until.mjs';

export default async function (page) {
	await reachQuestion(page, 'W jakiej kolejności powstały te dzieła?');
	const first = page.getByRole('button', { name: 'Dzieło na miejscu 1 z 4' });
	await first.focus();
	await page.keyboard.press(' ');
	await page.keyboard.press('ArrowRight');
	await page.keyboard.press(' ');
	await page.getByRole('button', { name: 'Sprawdź kolejność' }).click();
	await page.waitForTimeout(400);
}
