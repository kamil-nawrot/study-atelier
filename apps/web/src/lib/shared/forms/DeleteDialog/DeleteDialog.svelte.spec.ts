import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import DeleteDialog from './DeleteDialog.svelte';

function mount(
	run: () => Promise<{ error?: string } | undefined>,
	ondone = vi.fn()
): ReturnType<typeof vi.fn> {
	const props = $state({ open: true, title: 'Remove it?', description: 'This is final.' });
	render(DeleteDialog, { ...props, run, ondone });
	return ondone;
}

describe('DeleteDialog', () => {
	it('runs the deletion and reports it done', async () => {
		const run = vi.fn().mockResolvedValue({});
		const ondone = mount(run);

		await expect.element(page.getByText('Remove it?')).toBeVisible();
		await page.getByRole('button', { name: m.common.delete }).click();

		expect(run).toHaveBeenCalledOnce();
		await vi.waitFor(() => expect(ondone).toHaveBeenCalledOnce());
	});

	it('shows the error and stays open', async () => {
		const ondone = mount(vi.fn().mockResolvedValue({ error: 'Offline.' }));

		await page.getByRole('button', { name: m.common.delete }).click();

		await expect.element(page.getByText('Offline.')).toBeVisible();
		expect(ondone).not.toHaveBeenCalled();
	});

	it('does nothing when the deletion has nothing to run on', async () => {
		const ondone = mount(vi.fn().mockResolvedValue(undefined));

		await page.getByRole('button', { name: m.common.delete }).click();

		await expect.element(page.getByText('Remove it?')).toBeVisible();
		expect(ondone).not.toHaveBeenCalled();
	});
});
