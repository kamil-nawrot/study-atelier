export async function typeTitle(page) {
	await page.getByRole('combobox', { name: 'Tytuł dzieła' }).fill('the');
}

export async function answerTitle(page) {
	await typeTitle(page);
	await page.getByRole('option').first().click();
	await page.getByRole('button', { name: 'Sprawdź tytuł' }).click();
}

export async function tapAll(page) {
	const tiles = page.getByRole('button', { name: 'Dzieło do ułożenia' });
	while ((await tiles.count()) > 0) await tiles.first().click();
}

export async function reachQuestion(page, heading) {
	await page.getByRole('button', { name: 'Zacznij powtórkę' }).click();
	const question = page.getByRole('heading', { name: heading });
	for (let step = 0; step < 80; step += 1) {
		await page.waitForTimeout(400);
		if (await question.isVisible()) return;
		const check = page.getByRole('button', { name: /^Sprawdź (rok|kolejność)$/ });
		if (await check.isVisible()) {
			await tapAll(page);
			await check.click();
			await page.getByRole('button', { name: 'Następne' }).click();
			continue;
		}
		const title = page.getByRole('combobox', { name: 'Tytuł dzieła' });
		if (await title.isVisible()) {
			await answerTitle(page);
			await page.getByRole('button', { name: 'Następne' }).click();
			continue;
		}
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
