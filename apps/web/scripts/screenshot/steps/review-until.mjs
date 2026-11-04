export async function reachQuestion(page, heading) {
	await page.getByRole('button', { name: 'Zacznij powtórkę' }).click();
	const question = page.getByRole('heading', { name: heading });
	for (let step = 0; step < 80; step += 1) {
		await page.waitForTimeout(400);
		if (await question.isVisible()) return;
		const reveal = page.getByRole('button', { name: 'Odkryj kartę' });
		if (await reveal.isVisible()) {
			await reveal.click();
			await page.getByRole('button', { name: /^Wiem/ }).click();
			continue;
		}
		await page.keyboard.press('1');
		await page.waitForTimeout(300);
		await page.keyboard.press('Enter');
	}
	throw new Error(`the session never asked "${heading}"`);
}
