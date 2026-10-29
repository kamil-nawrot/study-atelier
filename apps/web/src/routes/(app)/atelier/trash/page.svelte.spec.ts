import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { invalidate } from '$app/navigation';
import { findDuplicates } from '#lib/artworks/duplicates-data/duplicates-data.ts';
import { deletePermanently, restoreArtwork } from '#lib/artworks/trash-data/trash-data.ts';
import type { TrashArtwork } from '#lib/wall/types/trash-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import { REVIEW_COUNTS_DEPENDENCY } from '#lib/review/review-data/review-data.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import TrashPage from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn(), invalidate: vi.fn() }));
vi.mock('#lib/artworks/trash-data/trash-data.ts', () => ({
	restoreArtwork: vi.fn(),
	deletePermanently: vi.fn()
}));
vi.mock('#lib/artworks/duplicates-data/duplicates-data.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/artworks/duplicates-data/duplicates-data.ts')>()),
	findDuplicates: vi.fn()
}));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const today = new Date().toISOString();

function trashed(
	number: number,
	title: string,
	overrides: Partial<TrashArtwork> = {}
): TrashArtwork {
	return {
		...testArtwork(number, title),
		deletedAt: today,
		ownImagePath: null,
		...overrides
	};
}

const artworks = [
	trashed(42, 'Girl with a Pearl Earring', { ownImagePath: 'owner/pearl.jpg' }),
	trashed(7, 'Night Watch', { image: undefined })
];

function renderTrash(list: TrashArtwork[] = artworks, error?: string): void {
	render(TrashPage, { data: { session: testSession(), artworks: list, error }, params: {} });
}

function row(title: string): ReturnType<typeof page.getByRole> {
	return page.getByRole('listitem').filter({ hasText: title });
}

describe('trash page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		vi.mocked(findDuplicates).mockResolvedValue([]);
		await page.viewport(1280, 800);
	});

	it('lists the artworks in the trash with the count and the day they were deleted', async () => {
		renderTrash();

		await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent(m.trash.title);
		await expect.element(page.getByText(m.atelier.count(2))).toBeVisible();
		await expect.element(row('Girl with a Pearl Earring')).toBeVisible();
		await expect
			.element(
				row('Girl with a Pearl Earring').getByText(`#0042 · ${m.trash.deletedOn(m.trash.today)}`)
			)
			.toBeVisible();
		await expect.element(row('Night Watch').getByText('Test Painter · 1900')).toBeVisible();
		await expect
			.element(page.getByRole('banner').getByRole('link', { name: m.artworkView.back }))
			.not.toBeInTheDocument();
	});

	it('restores an artwork without asking when no other artwork matches', async () => {
		vi.mocked(restoreArtwork).mockResolvedValue({});
		renderTrash();

		await row('Night Watch').getByRole('button', { name: m.trash.restore }).click();

		expect(findDuplicates).toHaveBeenCalledWith(artworks[1], 'artwork-7');
		expect(restoreArtwork).toHaveBeenCalledWith('artwork-7');
		await expect.element(page.getByText(m.trash.restored('#0007'))).toBeVisible();
		await expect.element(row('Night Watch')).not.toBeInTheDocument();
		await expect.element(page.getByText(m.atelier.count(1))).toBeVisible();
		expect(invalidate).toHaveBeenCalledWith(REVIEW_COUNTS_DEPENDENCY);
	});

	it('shows an alert when restoring fails and keeps the artwork', async () => {
		vi.mocked(restoreArtwork).mockResolvedValue({ error: m.common.network });
		renderTrash();

		await row('Night Watch').getByRole('button', { name: m.trash.restore }).click();

		await expect.element(page.getByText(m.trash.actionErrorTitle)).toBeVisible();
		await expect.element(page.getByText(m.common.network)).toBeVisible();
		await expect.element(row('Night Watch')).toBeVisible();
	});

	it('deletes an artwork permanently after the learner confirms', async () => {
		vi.mocked(deletePermanently).mockResolvedValue({});
		renderTrash();

		await row('Girl with a Pearl Earring')
			.getByRole('button', { name: m.trash.deleteForever })
			.click();
		const dialog = page.getByRole('alertdialog', { name: m.trash.deleteTitle('#0042') });
		await expect.element(dialog.getByText(m.trash.deleteDescription('#0042'))).toBeVisible();
		await dialog.getByRole('button', { name: m.trash.deleteForever }).click();

		expect(deletePermanently).toHaveBeenCalledWith('artwork-42');
		await expect.element(page.getByText(m.trash.deleted('#0042'))).toBeVisible();
		await expect.element(row('Girl with a Pearl Earring')).not.toBeInTheDocument();
	});

	it('keeps the artwork when the learner cancels the permanent delete', async () => {
		renderTrash();

		await row('Night Watch').getByRole('button', { name: m.trash.deleteForever }).click();
		await page.getByRole('button', { name: m.common.cancel }).click();

		await expect.element(page.getByRole('alertdialog')).not.toBeInTheDocument();
		expect(deletePermanently).not.toHaveBeenCalled();
		await expect.element(row('Night Watch')).toBeVisible();
	});

	it('shows an error in the dialog when the permanent delete fails', async () => {
		vi.mocked(deletePermanently).mockResolvedValue({ error: m.common.network });
		renderTrash();

		await row('Night Watch').getByRole('button', { name: m.trash.deleteForever }).click();
		await page
			.getByRole('alertdialog')
			.getByRole('button', { name: m.trash.deleteForever })
			.click();

		await expect.element(page.getByRole('alertdialog').getByText(m.common.network)).toBeVisible();
	});

	it('says the trash is empty and what goes into it', async () => {
		renderTrash([]);

		await expect
			.element(page.getByRole('heading', { level: 2 }))
			.toHaveTextContent(m.trash.emptyTitle);
		await expect.element(page.getByText(m.trash.empty)).toBeVisible();
	});

	it('shows a load error in an alert', async () => {
		renderTrash([], m.collectionErrors.network);

		await expect.element(page.getByText(m.trash.loadErrorTitle)).toBeVisible();
		await expect.element(page.getByText(m.collectionErrors.network)).toBeVisible();
	});

	describe('on a phone', () => {
		beforeEach(async () => {
			await page.viewport(390, 844);
		});

		it('shows the actions as icon buttons with their names', async () => {
			renderTrash();

			await expect
				.element(row('Night Watch').getByRole('button', { name: m.trash.restore }))
				.toBeVisible();
			await expect
				.element(row('Night Watch').getByText(m.trash.restore, { exact: true }))
				.not.toBeVisible();
		});
	});
});
