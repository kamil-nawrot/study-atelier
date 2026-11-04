import { reachQuestion } from './review-until.mjs';

export default async function (page) {
	await reachQuestion(page, 'Kiedy powstało to dzieło?');
	await page.getByRole('slider', { name: 'Rok powstania dzieła' }).focus();
	await page.keyboard.press('PageDown');
	await page.keyboard.press('PageDown');
	await page.getByRole('button', { name: 'Sprawdź rok' }).click();
	await page.waitForTimeout(400);
}
