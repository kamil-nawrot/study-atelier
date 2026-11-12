import { reachQuestion, tapAll } from './review-until.mjs';

export default async function (page) {
	await reachQuestion(page, 'W jakiej kolejności powstały te dzieła?');
	const first = page.getByRole('button', { name: 'Dzieło na miejscu 1 z 4' });
	if (await first.isVisible()) {
		await first.focus();
		await page.keyboard.press(' ');
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press(' ');
	} else {
		await tapAll(page);
	}
	await page.getByRole('button', { name: 'Sprawdź kolejność' }).click();
	await page.waitForTimeout(400);
}
