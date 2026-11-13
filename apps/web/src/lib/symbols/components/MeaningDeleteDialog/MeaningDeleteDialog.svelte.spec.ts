import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import MeaningDeleteDialog from './MeaningDeleteDialog.svelte';

describe('MeaningDeleteDialog', () => {
	it('explains what happens to the pins and confirms', async () => {
		const onconfirm = vi.fn();
		render(MeaningDeleteDialog, { open: true, onconfirm });

		await expect.element(page.getByText(m.symbols.meaningDialog.removeTitle)).toBeVisible();
		await expect.element(page.getByText(m.symbols.meaningDialog.removeDescription)).toBeVisible();
		await page.getByRole('button', { name: m.common.delete }).click();

		expect(onconfirm).toHaveBeenCalled();
	});

	it('shows an error', async () => {
		render(MeaningDeleteDialog, { open: true, error: 'Offline.', onconfirm: vi.fn() });

		await expect.element(page.getByText('Offline.')).toBeVisible();
	});
});
