import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import MeaningDialog from './MeaningDialog.svelte';

vi.mock('#lib/symbols/symbols-data/symbols-data.ts', () => ({
	searchArtworkContexts: vi.fn().mockResolvedValue([])
}));

const penance = { id: 'penance', text: 'penance', contexts: [] };

describe('MeaningDialog', () => {
	it('saves a new meaning with its trimmed text', async () => {
		const onsave = vi.fn();
		render(MeaningDialog, { open: true, candidates: [], onsave });

		await expect.element(page.getByText(m.symbols.meaningDialog.newTitle)).toBeVisible();
		await page.getByRole('textbox', { name: m.symbols.form.meaning }).fill('  danger ');
		await page.getByRole('button', { name: m.common.save }).click();

		expect(onsave).toHaveBeenCalledWith({ text: 'danger', contexts: [] });
	});

	it('asks for a text before saving', async () => {
		const onsave = vi.fn();
		render(MeaningDialog, { open: true, candidates: [], onsave });

		await page.getByRole('button', { name: m.common.save }).click();

		await expect.element(page.getByText(m.symbols.form.meaningRequired)).toBeVisible();
		expect(onsave).not.toHaveBeenCalled();
	});

	it('edits a meaning and offers to remove it', async () => {
		const onremove = vi.fn();
		render(MeaningDialog, {
			open: true,
			meaning: penance,
			candidates: [],
			onsave: vi.fn(),
			onremove
		});

		await expect.element(page.getByText(m.symbols.meaningDialog.editTitle)).toBeVisible();
		await expect
			.element(page.getByRole('textbox', { name: m.symbols.form.meaning }))
			.toHaveValue('penance');
		await page.getByRole('button', { name: m.symbols.meaningDialog.remove }).click();

		expect(onremove).toHaveBeenCalled();
	});

	it('shows why saving failed', async () => {
		render(MeaningDialog, {
			open: true,
			candidates: [],
			error: 'Offline.',
			onsave: vi.fn()
		});

		await expect.element(page.getByText('Offline.')).toBeVisible();
	});
});
