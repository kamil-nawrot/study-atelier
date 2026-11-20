import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import { testOwnFields } from '#lib/testing/own-fields/own-fields.ts';
import { goto } from '$app/navigation';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import ValuePage from './+page.svelte';
import type { OwnValue } from '#lib/card-index/types/own-value.ts';

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/atelier/fields/motifs/values/angel'),
		state: {},
		data: {}
	},
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn(), invalidateAll: vi.fn() }));
vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({
	refreshExpiredImages: vi.fn(),
	resolveImages: vi.fn(),
	loadArtworksOfValue: vi.fn()
}));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), rpc: vi.fn(), auth: { signOut: vi.fn() } }
}));

describe('own value page', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('goes back to its field and opens the value form from the bar', async () => {
		const fields = testOwnFields();
		render(ValuePage, {
			data: {
				session: testSession(),
				field: fields[1],
				value: fields[1].values[0],
				fields,
				artworks: []
			},
			params: { id: 'motifs', valueId: 'angel' }
		});

		await expect
			.element(page.getByRole('link', { name: 'Motifs' }))
			.toHaveAttribute('href', '/atelier/fields/motifs');
		await page.getByRole('button', { name: m.common.edit }).click();
		await expect.element(page.getByRole('textbox', { name: m.common.name })).toHaveValue('Angel');
	});

	async function renderValue(value: OwnValue): Promise<void> {
		await page.viewport(1280, 800);
		const fields = testOwnFields();
		render(ValuePage, {
			data: { session: testSession(), field: fields[1], value, fields, artworks: [] },
			params: { id: 'motifs', valueId: value.id }
		});
	}

	it('deletes a value no artwork uses after a confirmation and returns to its field', async () => {
		vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);
		await renderValue({ id: 'putto', fieldId: 'motifs', name: 'Putto', count: 0 });

		await page.getByRole('banner').getByRole('button', { name: m.common.delete }).click();
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
		await renderValue(testOwnFields()[1].values[0]);

		const button = page.getByRole('banner').getByRole('button', { name: m.common.delete });
		await expect.element(button).toHaveAttribute('aria-disabled', 'true');
		await expect
			.element(button)
			.toHaveAccessibleDescription(m.ownFields.value.deleteBlocked('2 dzieła'));
	});

	it('says the value does not exist', async () => {
		render(ValuePage, {
			data: {
				session: testSession(),
				fields: [],
				artworks: [],
				error: m.ownFields.page.notFound,
				notFound: true
			},
			params: { id: 'motifs', valueId: 'gone' }
		});

		await expect.element(page.getByText(m.ownFields.page.notFound)).toBeVisible();
		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.ownFields.page.notFoundTitle);
	});
});
