import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import DetailMeaningMenu from './DetailMeaningMenu.svelte';

const meanings = [
	{ id: 'transience', text: 'transience', contexts: [] },
	{ id: 'penance', text: 'penance', contexts: [] }
];

async function open(current: string | null, onchoose = vi.fn()): Promise<typeof onchoose> {
	await render(DetailMeaningMenu, { meanings, current, onchoose });
	await page.getByRole('button', { name: m.symbols.view.changeMeaning }).click();
	return onchoose;
}

describe('DetailMeaningMenu', () => {
	it('lists the numbered meanings and none, marking the current one', async () => {
		await open('penance');

		await expect.element(page.getByRole('button', { name: '1 transience' })).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: '2 penance' }))
			.toHaveAttribute('aria-current', 'true');
		await expect
			.element(page.getByRole('button', { name: m.symbols.view.withoutMeaning }))
			.toBeVisible();
	});

	it('chooses another meaning or none', async () => {
		const onchoose = await open('transience');

		await page.getByRole('button', { name: m.symbols.view.withoutMeaning }).click();

		expect(onchoose).toHaveBeenCalledWith(null);
	});

	it('does nothing when the current meaning is chosen again', async () => {
		const onchoose = await open('transience');

		await page.getByRole('button', { name: '1 transience' }).click();

		expect(onchoose).not.toHaveBeenCalled();
	});
});
