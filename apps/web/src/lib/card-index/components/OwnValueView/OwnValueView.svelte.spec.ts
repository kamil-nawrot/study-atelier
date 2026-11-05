import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto, invalidateAll } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testOwnFields } from '#lib/testing/own-fields/own-fields.ts';
import OwnValueView from './OwnValueView.svelte';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

vi.mock('$app/navigation', () => ({ goto: vi.fn(), invalidateAll: vi.fn() }));
vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({
	refreshExpiredImages: vi.fn(),
	resolveImages: vi.fn(),
	loadArtworksOfValue: vi.fn()
}));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { from: vi.fn(), rpc: vi.fn() }
}));

const query = { update: vi.fn(), eq: vi.fn() };

async function renderView(
	artworks: WallArtwork[] = [testArtwork(1, 'Annunciation')]
): Promise<{ edit: () => void }> {
	const [, motifs] = testOwnFields();
	const screen = await render(OwnValueView, { field: motifs, value: motifs.values[1], artworks });
	return screen.component as unknown as { edit: () => void };
}

describe('OwnValueView', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockReturnValue(query as never);
		query.update.mockReturnValue(query);
		query.eq.mockResolvedValue({ error: null });
		vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);
	});

	it('names the field and shows the artworks with the value', async () => {
		await renderView();

		await expect.element(page.getByRole('heading', { level: 1, name: 'Angle' })).toBeVisible();
		await expect
			.element(page.getByText(`${m.ownFields.page.valueKind('Motifs')} · 1 dzieło`))
			.toBeVisible();
		await expect.element(page.getByText('Annunciation')).toBeVisible();
	});

	it('says no artwork has the value yet', async () => {
		await renderView([]);

		await expect.element(page.getByText(m.ownFields.page.noArtworks)).toBeVisible();
	});

	it('renames the value and reloads the page', async () => {
		const view = await renderView();
		view.edit();
		await page.getByRole('textbox', { name: m.common.name }).fill('Corner');
		await page.getByRole('button', { name: m.common.save, exact: true }).click();

		expect(query.update).toHaveBeenCalledWith({ name: 'Corner' });
		await vi.waitFor(() => expect(invalidateAll).toHaveBeenCalled());
		await expect.element(page.getByText(m.ownFields.saved('Corner'))).toBeVisible();
	});

	it('merges into another value after a confirmation and opens the kept value', async () => {
		const view = await renderView();
		view.edit();
		await page.getByRole('textbox', { name: m.common.name }).fill('angel');

		await expect
			.element(page.getByText(m.ownFields.value.mergeHint('Angel', '2 dzieła')))
			.toBeVisible();
		await page.getByRole('button', { name: m.common.merge, exact: true }).click();
		await page
			.getByRole('alertdialog', { name: m.cardIndex.mergeConfirm.title('Angle', 'Angel') })
			.getByRole('button', { name: m.common.merge })
			.click();

		expect(supabase.rpc).toHaveBeenCalledWith('merge_category_values', {
			merged_id: 'angle',
			kept_id: 'angel'
		});
		await vi.waitFor(() =>
			expect(goto).toHaveBeenCalledWith('/atelier/fields/motifs/values/angel', { replace: true })
		);
	});
});
