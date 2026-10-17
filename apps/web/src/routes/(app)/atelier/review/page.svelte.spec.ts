import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { invalidate } from '$app/navigation';
import type { WallArtwork } from '#lib/collection/types.ts';
import { m } from '#lib/i18n/index.ts';
import { resolveImages } from '#lib/collection/artworks.ts';
import { loadReviewDetails, loadSession, recordReview } from '#lib/review/review-data.ts';
import type { ReviewCard, SessionRow } from '#lib/review/types.ts';
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
	loadReviewDetails: vi.fn().mockResolvedValue({ details: new Map() }),
	loadSession: vi.fn(),
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

function flashcards(...numbers: number[]): SessionRow[] {
	return numbers.map((number) => ({ artwork_id: `artwork-${number}`, mode: 'flashcard' }));
}

function renderReview(
	artworks: WallArtwork[],
	reviewCards: Map<string, ReviewCard> = new Map(),
	newToday = 0,
	error?: string,
	streak = 0
): void {
	render(ReviewPage, {
		data: { session: testSession(), artworks, cards: reviewCards, newToday, streak, error },
		params: {}
	});
}

describe('review page', () => {
	beforeEach(async () => {
		vi.useFakeTimers({ now: new Date(2026, 9, 16, 21, 30), toFake: ['Date'] });
		vi.mocked(recordReview).mockReset().mockResolvedValue({});
		vi.mocked(loadSession)
			.mockReset()
			.mockResolvedValue({ rows: flashcards(1, 2, 20, 21) });
		vi.mocked(invalidate).mockClear();
		await page.viewport(1280, 800);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('says how many artworks wait today and how many are new, and how the reviews work', async () => {
		const artworks = collection(25);
		renderReview(
			artworks,
			cards(artworks.slice(0, 20), (index) => (index < 4 ? -1 : 5))
		);

		await expect.element(page.getByRole('heading', { name: m.review.waiting(9) })).toBeVisible();
		await expect.element(page.getByText(m.review.plan(4, 5))).toBeVisible();
		await expect.element(page.getByRole('button', { name: m.review.start })).toBeVisible();
		await expect.element(page.getByRole('heading', { name: m.review.howTitle })).toBeVisible();
		await expect.element(page.getByText(m.review.how)).toBeVisible();
		await expect
			.element(page.getByRole('banner').getByRole('link', { name: m.artworkView.back }))
			.toHaveAttribute('href', '/atelier');
	});

	it('tells how many days in a row there were reviews', async () => {
		renderReview(collection(25), new Map(), 0, undefined, 5);

		await expect.element(page.getByText(m.review.streak(5))).toBeVisible();
	});

	it('says nothing about a streak when there is none', async () => {
		renderReview(collection(25));

		await expect.element(page.getByRole('heading', { name: m.review.waiting(10) })).toBeVisible();
		await expect.element(page.getByText(m.review.streak(0))).not.toBeInTheDocument();
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

		await expect.element(page.getByText(m.review.tooFew(20, 5))).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.atelier.add }))
			.toHaveAttribute('href', '/atelier/new');
		await expect
			.element(page.getByRole('button', { name: m.review.start }))
			.not.toBeInTheDocument();
	});

	it('says when the next artworks wait once today is done', async () => {
		const artworks = collection(20);
		renderReview(
			artworks,
			cards(artworks, (index) => (index === 0 ? 1 : 6))
		);

		await expect.element(page.getByRole('heading', { name: m.review.allDoneTitle })).toBeVisible();
		await expect.element(page.getByText(m.review.allDone('jutro'))).toBeVisible();
	});

	it('offers a style with at least 10 artworks due, and describes the chosen form, behind a disclosure', async () => {
		const artworks = collection(25).map((artwork, index) => ({
			...artwork,
			styles: index < 21 ? ['Caravaggism'] : []
		}));
		renderReview(
			artworks,
			cards(artworks.slice(0, 12), () => -1)
		);

		const caravaggism = page.getByRole('button', { name: /^Caravaggism/ });
		await expect.element(caravaggism).not.toBeInTheDocument();

		await page.getByText(m.review.options).click();
		await expect
			.element(page.getByRole('button', { name: new RegExp(`^${m.review.scopes.all}`) }))
			.toHaveAttribute('aria-pressed', 'true');
		await expect.element(caravaggism).toHaveTextContent(/^Caravaggism\s*20$/);
		await expect.element(page.getByText(m.review.formHints.mixed)).toBeVisible();

		await caravaggism.click();
		await expect.element(caravaggism).toHaveAttribute('aria-pressed', 'true');
		await page.getByRole('button', { name: m.review.forms.flashcards }).click();
		await expect.element(page.getByText(m.review.formHints.flashcards)).toBeVisible();
	});

	it('shows how well the atelier is known and links the artworks that gave trouble', async () => {
		const artworks = collection(25);
		const known = cards(artworks.slice(0, 3), () => 5);
		known.set(
			artworks[0].id,
			testReviewCard(artworks[0].id, new Date(Date.now() + 5 * DAY), { lapses: 1 })
		);
		renderReview(artworks, known);

		await expect.element(page.getByRole('heading', { name: m.review.knowledge })).toBeVisible();
		await expect.element(page.getByText(m.review.knowledgeGroups.settled.label)).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: /Artwork 1\b/ }))
			.toHaveAttribute('href', '/atelier/1');
	});

	it('goes through a session card by card and ends with a summary', async () => {
		const artworks = collection(21);
		renderReview(
			artworks,
			cards(artworks.slice(0, 19), (index) => (index < 2 ? -1 : 6))
		);

		await page.getByText(m.review.options).click();
		await page.getByRole('button', { name: m.review.forms.flashcards }).click();
		await page.getByRole('button', { name: m.review.start }).click();
		await expect.element(page.getByText(m.review.progress(1, 4))).toBeVisible();
		expect(loadSession).toHaveBeenCalledWith(expect.any(Date), 'flashcards', { kind: 'all' });

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

	it('asks new artworks as quizzes, shows the answer at once and goes on with Enter', async () => {
		const artworks = collection(21);
		renderReview(
			artworks,
			cards(artworks.slice(0, 19), () => 6)
		);

		vi.mocked(loadSession).mockResolvedValue({
			rows: [
				{
					artwork_id: 'artwork-20',
					mode: 'quiz_title',
					options: [
						{ artwork_id: 'artwork-3', label: 'Artwork 3', reason: 'period' },
						{ artwork_id: 'artwork-20', label: 'Artwork 20', right: true },
						{ artwork_id: 'artwork-4', label: 'Artwork 4' },
						{ artwork_id: 'artwork-5', label: 'Artwork 5' }
					]
				},
				...flashcards(21)
			]
		});

		await page.getByRole('button', { name: m.review.start }).click();
		await expect.element(page.getByText(m.review.progress(1, 2))).toBeVisible();

		await expect
			.element(page.getByRole('heading', { level: 1 }))
			.toHaveTextContent(m.review.quiz.titleQuestion);
		await userEvent.keyboard('2');

		await expect.element(page.getByRole('button', { name: m.review.quiz.next })).toHaveFocus();
		expect(recordReview).toHaveBeenCalledWith(
			expect.objectContaining({ artworkId: 'artwork-20' }),
			expect.objectContaining({ mode: 'quiz_title', correct: true })
		);
		await expect
			.element(page.getByRole('status'))
			.toHaveTextContent(new RegExp(`^${m.review.quiz.right}`));

		await userEvent.keyboard('{Enter}');
		await expect.element(page.getByText(/^2 z/)).toBeVisible();
	});

	it('says when a session could not be started and stays on the start', async () => {
		vi.mocked(loadSession).mockResolvedValue({ rows: [], error: 'Brak połączenia.' });
		renderReview(collection(21));

		await page.getByRole('button', { name: m.review.start }).click();

		await expect.element(page.getByText(m.review.startErrorTitle)).toBeVisible();
		await expect.element(page.getByText('Brak połączenia.')).toBeVisible();
		await expect.element(page.getByRole('button', { name: m.review.start })).toBeEnabled();
	});

	it('stays on the start with an error when the notes of a session cannot be loaded', async () => {
		vi.mocked(loadReviewDetails).mockResolvedValueOnce({
			details: new Map(),
			error: 'Brak połączenia.'
		});
		renderReview(collection(21));

		await page.getByRole('button', { name: m.review.start }).click();

		await expect.element(page.getByText('Brak połączenia.')).toBeVisible();
		await expect.element(page.getByRole('button', { name: m.review.start })).toBeEnabled();
	});

	it('stays on the start with an error when the images of a session fail to resolve', async () => {
		vi.mocked(resolveImages).mockRejectedValueOnce(new Error('offline'));
		renderReview(
			collection(21).map((artwork) => ({
				...artwork,
				pendingImage: { sourceFile: 'Work.jpg' }
			}))
		);

		await page.getByRole('button', { name: m.review.start }).click();

		await expect.element(page.getByText(m.common.unexpectedError)).toBeVisible();
		await expect.element(page.getByRole('button', { name: m.review.start })).toBeEnabled();
	});
});
