import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto, invalidateAll } from '$app/navigation';
import { m } from '#lib/i18n/i18n.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testOwnFields } from '#lib/testing/own-fields/own-fields.ts';
import OwnValuePage from './OwnValuePage.svelte';
import type { OwnValuePageData } from '#lib/card-index/own-field-pages/own-field-pages.ts';

vi.mock('$app/state', () => ({
	page: {
		url: new URL('http://localhost/atelier/fields/motifs/values/angle'),
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

const query = { update: vi.fn(), eq: vi.fn() };

function renderPage(data: Partial<OwnValuePageData> = {}): void {
	const fields = testOwnFields();
	render(OwnValuePage, {
		email: 'learner@example.com',
		data: {
			field: fields[1],
			value: fields[1].values[1],
			fields,
			artworks: [testArtwork(1, 'Annunciation')],
			...data
		}
	});
}

describe('OwnValuePage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(supabase.from).mockReturnValue(query as never);
		query.update.mockReturnValue(query);
		query.eq.mockResolvedValue({ error: null });
		vi.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);
	});

	it('names the field and shows the artworks with the value', async () => {
		renderPage();

		await expect.element(page.getByRole('heading', { level: 1, name: 'Angle' })).toBeVisible();
		await expect
			.element(page.getByText(`${m.ownFields.page.valueKind('Motifs')} · 1 dzieło`))
			.toBeVisible();
		await expect.element(page.getByText('Annunciation')).toBeVisible();
	});

	it('says no artwork has the value yet', async () => {
		renderPage({ artworks: [] });

		await expect.element(page.getByText(m.ownFields.page.noArtworks)).toBeVisible();
	});

	it('renames the value and reloads the page', async () => {
		renderPage();
		await page.getByRole('button', { name: m.common.edit }).click();
		await page.getByRole('textbox', { name: m.common.name }).fill('Corner');
		await page.getByRole('button', { name: m.common.save, exact: true }).click();

		expect(query.update).toHaveBeenCalledWith({ name: 'Corner' });
		await vi.waitFor(() => expect(invalidateAll).toHaveBeenCalled());
		await expect.element(page.getByText(m.ownFields.saved('Corner'))).toBeVisible();
	});

	it('merges into another value after a confirmation and opens the kept value', async () => {
		renderPage();
		await page.getByRole('button', { name: m.common.edit }).click();
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

	it('says the value does not exist', async () => {
		renderPage({ value: undefined, error: m.ownFields.page.notFound, notFound: true });

		await expect.element(page.getByText(m.ownFields.page.notFound)).toBeVisible();
	});
});
