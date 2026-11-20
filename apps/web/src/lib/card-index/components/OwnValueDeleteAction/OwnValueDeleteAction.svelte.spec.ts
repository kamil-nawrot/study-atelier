import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { testOwnFields } from '#lib/testing/own-fields/own-fields.ts';
import OwnValueDeleteAction from './OwnValueDeleteAction.svelte';
import type { OwnValue } from '#lib/card-index/types/own-value.ts';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), rpc: vi.fn() }
}));

async function renderAction(value: OwnValue): Promise<void> {
	await page.viewport(1280, 800);
	render(OwnValueDeleteAction, { field: testOwnFields()[1], value });
}

describe('OwnValueDeleteAction', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deletes a value no artwork uses after a confirmation and returns to its field', async () => {
		vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);
		await renderAction({ id: 'putto', fieldId: 'motifs', name: 'Putto', count: 0 });

		await page.getByRole('button', { name: m.common.delete }).first().click();
		const dialog = page.getByRole('alertdialog', { name: m.ownFields.value.deleteTitle('Putto') });
		await expect
			.element(dialog)
			.toHaveAccessibleDescription(m.ownFields.value.deleteDescription('Motifs'));
		await dialog.getByRole('button', { name: m.common.delete }).click();

		expect(supabase.rpc).toHaveBeenCalledWith('delete_unused_value', { target_value: 'putto' });
		await vi.waitFor(() =>
			expect(goto).toHaveBeenCalledWith('/atelier/fields/motifs', {
				refreshAll: true,
				state: { valueMessage: m.cardIndex.deleted('Putto') }
			})
		);
	});

	it('does not delete a value artworks use and says how to merge it', async () => {
		await renderAction(testOwnFields()[1].values[0]);

		const button = page.getByRole('button', { name: m.common.delete }).first();
		await expect.element(button).toHaveAttribute('aria-disabled', 'true');
		await expect
			.element(button)
			.toHaveAccessibleDescription(m.ownFields.value.deleteBlocked('2 dzieła'));
	});
});
