import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import MeaningInputs from './MeaningInputs.svelte';

vi.mock('#lib/symbols/symbols-data/symbols-data.ts', () => ({
	searchArtworkContexts: vi.fn().mockResolvedValue([])
}));

describe('MeaningInputs', () => {
	it('keeps the context field behind a button until it is asked for', async () => {
		render(MeaningInputs, { text: 'penance', contexts: [], candidates: [] });

		await expect
			.element(page.getByRole('combobox', { name: m.symbols.form.context }))
			.not.toBeInTheDocument();
		await page.getByRole('button', { name: m.symbols.form.addContext }).click();
		await expect
			.element(page.getByRole('combobox', { name: m.symbols.form.context }))
			.toBeVisible();
	});

	it('shows the context field at once for a meaning with labels', async () => {
		render(MeaningInputs, {
			text: 'penance',
			contexts: [{ kind: 'text', name: 'hermit cell' }],
			candidates: []
		});

		await expect
			.element(page.getByRole('combobox', { name: m.symbols.form.context }))
			.toBeVisible();
	});

	it('shows an error under the text', async () => {
		render(MeaningInputs, { text: '', contexts: [], candidates: [], error: 'Missing.' });

		await expect.element(page.getByText('Missing.')).toBeVisible();
	});
});
