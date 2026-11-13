import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import MeaningFields from './MeaningFields.svelte';

vi.mock('#lib/symbols/symbols-data/symbols-data.ts', () => ({
	searchArtworkContexts: vi.fn().mockResolvedValue([])
}));

function renderMeaning(
	number: number,
	count: number
): {
	onmove: ReturnType<typeof vi.fn>;
	onremove: ReturnType<typeof vi.fn>;
} {
	const onmove = vi.fn();
	const onremove = vi.fn();
	render(MeaningFields, {
		meaning: { key: 'm1', text: 'transience', contexts: [] },
		number,
		count,
		candidates: [],
		error: undefined,
		onmove,
		onremove
	});
	return { onmove, onremove };
}

describe('MeaningFields', () => {
	it('names the meaning by its number and moves or removes it', async () => {
		const { onmove, onremove } = renderMeaning(2, 3);

		await expect
			.element(page.getByText(m.symbols.form.meaningHeading(2), { exact: true }))
			.toBeVisible();
		await expect
			.element(page.getByRole('textbox', { name: m.symbols.form.meaning }))
			.toHaveValue('transience');
		await page.getByRole('button', { name: m.symbols.form.moveUp(2) }).click();
		await page.getByRole('button', { name: m.symbols.form.moveDown(2) }).click();
		await page.getByRole('button', { name: m.symbols.form.removeMeaning(2) }).click();

		expect(onmove.mock.calls).toEqual([[-1], [1]]);
		expect(onremove).toHaveBeenCalled();
	});

	it('offers no moving for a single meaning and disables moves past the ends', async () => {
		const single = renderMeaning(1, 1);
		await expect
			.element(page.getByRole('button', { name: m.symbols.form.moveUp(1) }))
			.not.toBeInTheDocument();
		expect(single.onmove).not.toHaveBeenCalled();
	});

	it('keeps the context field behind a button until it is asked for', async () => {
		renderMeaning(1, 1);

		await expect
			.element(page.getByRole('combobox', { name: m.symbols.form.context }))
			.not.toBeInTheDocument();
		await page.getByRole('button', { name: m.symbols.form.addContext }).click();
		await expect
			.element(page.getByRole('combobox', { name: m.symbols.form.context }))
			.toBeVisible();
	});
});
