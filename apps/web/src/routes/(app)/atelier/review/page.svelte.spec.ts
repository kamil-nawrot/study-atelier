import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { invalidate } from '$app/navigation';
import type { WallArtwork } from '#lib/collection/types.ts';
import { m } from '#lib/i18n/index.ts';
import { recordReview } from '#lib/review/review-data.ts';
import type { ReviewCard } from '#lib/review/types.ts';
import { testArtwork } from '#lib/testing/artworks.ts';
import { testSession } from '#lib/testing/auth.ts';
import { testReviewCard } from '#lib/testing/review.ts';
import ReviewPage from './+page.svelte';

const navigation = vi.hoisted(() => ({
	url: new URL('http://localhost/atelier/review'),
	state: {} as App.PageState,
	data: {}
}));

vi.mock('$app/state', () => ({ page: navigation, navigating: { to: null } }));
vi.mock('$app/navigation', () => ({ goto: vi.fn(), invalidate: vi.fn() }));
vi.mock('#lib/collection/artworks.ts', () => ({ resolveImages: vi.fn().mockResolvedValue([]) }));
vi.mock('#lib/review/review-data.ts', () => ({
	REVIEW_COUNTS_DEPENDENCY: 'review:counts',
	loadReviewDetails: vi.fn().mockResolvedValue(new Map()),
	recordReview: vi.fn()
}));
vi.mock('#lib/supabase.ts', () => ({ supabase: { auth: { signOut: vi.fn() } } }));

const DAY = 24 * 60 * 60 * 1000;

function collection(count: number): WallArtwork[] {
	return Array.from({ length: count }, (_, index) =>
		testArtwork(index + 1, `Artwork ${index + 1}`, {
			eraCode: index % 2 === 0 ? 'early_modern' : 'modern',
			period: index < 3 ? 'Baroque' : null
		})
	);
}

function cards(artworks: WallArtwork[], due: (index: number) => number): Map<string, ReviewCard> {
	return new Map(
		artworks.map((artwork, index) => [
			artwork.id,
			testReviewCard(artwork.id, new Date(Date.now() + due(index) * DAY))
		])
	);
}

function renderReview(
	artworks: WallArtwork[],
	reviewCards: Map<string, ReviewCard> = new Map(),
	newToday = 0,
	error?: string
): void {
	render(ReviewPage, {
		data: { session: testSession(), artworks, cards: reviewCards, newToday, error },
		params: {}
	});
}

describe('review page', () => {
	beforeEach(async () => {
		vi.mocked(recordReview).mockReset().mockResolvedValue({});
		vi.mocked(invalidate).mockClear();
		await page.viewport(1280, 800);
	});

	it('says how many artworks wait today, how many are new and how long it takes', async () => {
		const artworks = collection(25);
		renderReview(
			artworks,
			cards(artworks.slice(0, 20), (index) => (index < 4 ? -1 : 5))
		);

		await expect.element(page.getByRole('heading', { name: m.review.waiting(9) })).toBeVisible();
		await expect.element(page.getByText(m.review.plan(4, 5, 4))).toBeVisible();
		await expect.element(page.getByRole('button', { name: m.review.start })).toBeVisible();
	});

	it('shows why the reviews could not be loaded', async () => {
		renderReview([], new Map(), 0, 'Nie udało się wczytać.');

		await expect.element(page.getByText(m.review.loadErrorTitle)).toBeVisible();
		await expect.element(page.getByText('Nie udało się wczytać.')).toBeVisible();
	});

	it('counts new artworks against what was started today', async () => {
		renderReview(collection(25), new Map(), 7);

		await expect.element(page.getByRole('heading', { name: m.review.waiting(3) })).toBeVisible();
	});

	it('asks for more artworks with an image before the first session', async () => {
		renderReview(collection(15));

		await expect.element(page.getByText(m.review.tooFew(5))).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: m.review.start }))
			.not.toBeInTheDocument();
	});

	it('says when the next artworks wait once today is done', async () => {
		const artworks = collection(20);
		renderReview(
			artworks,
			cards(artworks, (index) => (index === 0 ? 1.2 : 6))
		);

		await expect.element(page.getByText(m.review.allDone('jutro'))).toBeVisible();
	});

	it('offers every era and only the styles with enough artworks, and counts what is missing', async () => {
		const artworks = collection(25).map((artwork, index) => ({
			...artwork,
			styles: index < 21 ? ['Caravaggism'] : []
		}));
		renderReview(artworks);

		await expect
			.element(page.getByRole('button', { name: m.review.scopes.all }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect.element(page.getByRole('button', { name: 'Caravaggism' })).toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Baroque' })).not.toBeInTheDocument();

		await page.getByRole('button', { name: 'Nowoczesność' }).click();
		await expect
			.element(page.getByRole('button', { name: 'Nowoczesność' }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect.element(page.getByText(m.review.tooFew(8))).toBeVisible();
	});

	it('goes through a session card by card and ends with a summary', async () => {
		const artworks = collection(21);
		renderReview(
			artworks,
			cards(artworks.slice(0, 19), (index) => (index < 2 ? -1 : 6))
		);

		await page.getByRole('button', { name: m.review.start }).click();
		await expect.element(page.getByText(m.review.progress(1, 4))).toBeVisible();

		for (const rating of [3, 2, 3, 3] as const) {
			await page.getByRole('button', { name: m.review.flashcard.reveal }).click();
			await page.getByRole('button', { name: new RegExp(`^${m.review.ratings[rating]}`) }).click();
		}

		await expect.element(page.getByRole('heading', { name: m.review.done })).toBeVisible();
		expect(recordReview).toHaveBeenCalledTimes(4);
		await expect
			.element(page.getByRole('heading', { name: new RegExp(m.review.groups[3]) }))
			.toBeVisible();
		await expect
			.element(page.getByRole('heading', { name: new RegExp(m.review.groups[2]) }))
			.toBeVisible();
		await expect.element(page.getByRole('link', { name: m.review.backToAtelier })).toBeVisible();
		expect(invalidate).toHaveBeenCalledWith('review:counts');
	});

	it('asks before stopping a session that has answers and keeps them', async () => {
		const artworks = collection(21);
		renderReview(
			artworks,
			cards(artworks.slice(0, 19), (index) => (index < 2 ? -1 : 6))
		);

		await page.getByRole('button', { name: m.review.start }).click();
		await page.getByRole('button', { name: m.review.flashcard.reveal }).click();
		await page.getByRole('button', { name: new RegExp(`^${m.review.ratings[3]}`) }).click();
		await page.getByRole('button', { name: m.review.stop }).click();

		await expect.element(page.getByText(m.review.progress(2, 4))).toBeVisible();
		const dialog = page.getByRole('alertdialog', { name: m.review.stopTitle });
		await expect.element(dialog.getByText(m.review.stopDescription)).toBeVisible();
		await dialog.getByRole('button', { name: m.review.stop }).click();

		await expect.element(page.getByRole('heading', { name: m.review.done })).toBeVisible();
		await expect.element(page.getByText(m.review.summary(1, 1, 0))).toBeVisible();
	});

	it('keeps the answer still being saved when the session is stopped', async () => {
		const artworks = collection(21);
		renderReview(
			artworks,
			cards(artworks.slice(0, 19), (index) => (index < 2 ? -1 : 6))
		);
		let saved: (value: object) => void = () => undefined;

		await page.getByRole('button', { name: m.review.start }).click();
		await page.getByRole('button', { name: m.review.flashcard.reveal }).click();
		await page.getByRole('button', { name: new RegExp(`^${m.review.ratings[3]}`) }).click();
		await expect.element(page.getByText(m.review.progress(2, 4))).toBeVisible();
		vi.mocked(recordReview).mockImplementationOnce(
			() => new Promise((resolve) => (saved = resolve))
		);
		await page.getByRole('button', { name: m.review.flashcard.reveal }).click();
		await page.getByRole('button', { name: new RegExp(`^${m.review.ratings[2]}`) }).click();
		await page.getByRole('button', { name: m.review.stop }).click();
		await page
			.getByRole('alertdialog', { name: m.review.stopTitle })
			.getByRole('button', { name: m.review.stop })
			.click();
		saved({});

		await expect.element(page.getByRole('heading', { name: m.review.done })).toBeVisible();
		await expect.element(page.getByText(m.review.summary(2, 1, 0))).toBeVisible();
	});
});
