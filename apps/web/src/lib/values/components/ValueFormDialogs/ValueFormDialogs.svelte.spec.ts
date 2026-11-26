import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import ValueFormDialogs from './ValueFormDialogs.svelte';

function renderDialogs(
	props: {
		moveOpen?: boolean;
		mergeOpen?: boolean;
		remaining?: ('antiquity' | 'middle_ages')[];
	} = {}
): Record<string, ReturnType<typeof vi.fn>> {
	const handlers = { onmove: vi.fn(), onmerge: vi.fn() };
	render(ValueFormDialogs, {
		busy: false,
		moveOpen: props.moveOpen ?? false,
		moveTo: '',
		moveText: 'Move text',
		remaining: props.remaining ?? [],
		mergeOpen: props.mergeOpen ?? false,
		mergeText: 'Merge text',
		mergeTitle: 'Merge title',
		...handlers
	});
	return handlers;
}

describe('ValueFormDialogs', () => {
	it('confirms the move of artworks to another era', async () => {
		const handlers = renderDialogs({ moveOpen: true, remaining: ['antiquity', 'middle_ages'] });

		await expect.element(page.getByText('Move text')).toBeVisible();
		await expect.element(page.getByLabelText(m.cardIndex.moveConfirm.pick)).toBeVisible();
		await page.getByRole('button', { name: m.cardIndex.moveConfirm.confirm }).click();
		expect(handlers.onmove).toHaveBeenCalled();
	});

	it('confirms a merge', async () => {
		const handlers = renderDialogs({ mergeOpen: true });

		await expect.element(page.getByText('Merge title')).toBeVisible();
		await page.getByRole('button', { name: m.common.merge }).click();
		expect(handlers.onmerge).toHaveBeenCalled();
	});
});
