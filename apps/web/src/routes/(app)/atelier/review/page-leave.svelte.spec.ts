import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { goto } from '$app/navigation';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import { defaultPreferences } from '#lib/profile/preferences/preferences.ts';
import { loadSession, recordReview } from '#lib/review/review-data/review-data.ts';
import type { ReviewCard } from '#lib/review/types/review-card.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { testSession } from '#lib/testing/auth/auth.ts';
import { leave } from '#lib/testing/navigation/navigation.ts';
import { testReviewCard } from '#lib/testing/review/review.ts';
import ReviewPage from './+page.svelte';

vi.mock('$app/state', () => ({
	page: { url: new URL('http://localhost/atelier/review'), state: {}, data: {} },
	navigating: { to: null },
	updated: { current: false }
}));
vi.mock('$app/navigation', () => ({
	beforeNavigate: vi.fn(),
	goto: vi.fn(),
	invalidate: vi.fn()
}));
vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({
	resolveImages: vi.fn().mockResolvedValue([])
}));
vi.mock('#lib/glossary/glossary-data/glossary-data.ts', async (importOriginal) => ({
	...(await importOriginal<typeof import('#lib/glossary/glossary-data/glossary-data.ts')>()),
	loadTermDefinitions: vi.fn().mockResolvedValue({ definitions: new Map() })
}));
vi.mock('#lib/review/review-data/review-data.ts', () => ({
	REVIEW_COUNTS_DEPENDENCY: 'review:counts',
	loadReviewDetails: vi.fn().mockResolvedValue({ details: new Map() }),
	loadNoteGap: vi.fn(),
	loadSession: vi.fn(),
	recordFreeAnswers: vi.fn(),
	recordRightAnswer: vi.fn().mockResolvedValue(undefined),
	recordReview: vi.fn(),
	withPinPreviews: async (items: unknown) => items
}));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { auth: { signOut: vi.fn() } }
}));

const DAY = 24 * 60 * 60 * 1000;
const VALUES = 'http://localhost/atelier/values';

function renderReview(dueInDays: number): void {
	const artworks: WallArtwork[] = Array.from({ length: 21 }, (_, index) =>
		testArtwork(index + 1, `Artwork ${index + 1}`)
	);
	const cards = new Map<string, ReviewCard>(
		artworks.map((artwork) => [
			artwork.id,
			testReviewCard(artwork.id, new Date(Date.now() + dueInDays * DAY))
		])
	);
	render(ReviewPage, {
		data: {
			session: testSession(),
			artworks,
			cards,
			newToday: 0,
			streak: 0,
			waiting: undefined,
			glossary: [],
			preferences: defaultPreferences,
			termPins: undefined,
			error: undefined
		},
		params: {}
	});
}

async function rateCard(next: number): Promise<void> {
	await page.getByRole('button', { name: m.review.flashcard.reveal }).click();
	await page.getByRole('button', { name: new RegExp(`^${m.review.ratings[3]}`) }).click();
	if (next <= 3) await expect.element(page.getByText(m.review.progress(next, 3))).toBeVisible();
}

async function startAndAnswer(): Promise<void> {
	renderReview(-1);
	await page.getByRole('button', { name: m.review.start }).click();
	await rateCard(2);
}

function stopDialog(): ReturnType<typeof page.getByRole> {
	return page.getByRole('alertdialog', { name: m.review.stopTitle });
}

describe('leaving the review page', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		vi.mocked(recordReview).mockResolvedValue({});
		vi.mocked(loadSession).mockResolvedValue({
			rows: [1, 2, 3].map((number) => ({ artwork_id: `artwork-${number}`, mode: 'flashcard' }))
		});
		await page.viewport(1280, 800);
	});

	it('asks before a link takes the learner out of a running session', async () => {
		await startAndAnswer();

		const navigation = leave('link', VALUES);

		expect(navigation.cancel).toHaveBeenCalled();
		await expect.element(stopDialog().getByText(m.review.stopDescription)).toBeVisible();
		expect(goto).not.toHaveBeenCalled();
	});

	it('keeps the learner in the session after "Powtarzaj dalej"', async () => {
		await startAndAnswer();

		leave('link', VALUES);
		await stopDialog().getByRole('button', { name: m.review.keepGoing }).click();

		await expect.element(stopDialog()).not.toBeInTheDocument();
		await expect.element(page.getByText(m.review.progress(2, 3))).toBeVisible();
		expect(goto).not.toHaveBeenCalled();
		expect(leave('link', VALUES).cancel).toHaveBeenCalled();
	});

	it('stops the session and goes where the learner clicked once they confirm', async () => {
		await startAndAnswer();

		leave('link', VALUES);
		await stopDialog().getByRole('button', { name: m.review.stop }).click();

		await vi.waitFor(() => expect(goto).toHaveBeenCalledWith('/atelier/values'));
		await expect.element(page.getByRole('heading', { level: 1, name: /powtórzon/ })).toBeVisible();
		expect(leave('link', VALUES).cancel).not.toHaveBeenCalled();
	});

	it('goes back through the history once the learner confirms leaving with the back button', async () => {
		const go = vi.spyOn(history, 'go').mockImplementation(() => {});
		await startAndAnswer();

		leave('popstate');
		await stopDialog().getByRole('button', { name: m.review.stop }).click();

		await vi.waitFor(() => expect(go).toHaveBeenCalledWith(-1));
		go.mockRestore();
	});

	it('says in a free session that its answers are not saved', async () => {
		renderReview(6);
		await page.getByRole('button', { name: m.review.free }).click();
		await rateCard(2);

		leave('link', VALUES);

		await expect.element(stopDialog().getByText(m.review.freeStopDescription)).toBeVisible();
	});

	it('lets the learner leave before the session starts', async () => {
		renderReview(-1);
		await expect.element(page.getByRole('button', { name: m.review.start })).toBeVisible();

		const navigation = leave('link', VALUES);

		expect(navigation.cancel).not.toHaveBeenCalled();
		expect(leave('leave').cancel).not.toHaveBeenCalled();
		await expect.element(stopDialog()).not.toBeInTheDocument();
	});

	it('lets the learner leave a session with nothing answered yet, as "Przerwij" does', async () => {
		renderReview(-1);
		await page.getByRole('button', { name: m.review.start }).click();
		await expect.element(page.getByText(m.review.progress(1, 3))).toBeVisible();

		expect(leave('link', VALUES).cancel).not.toHaveBeenCalled();
		await expect.element(stopDialog()).not.toBeInTheDocument();
	});

	it('lets the learner leave once the session is over', async () => {
		await startAndAnswer();
		await rateCard(3);
		await rateCard(4);
		await expect.element(page.getByRole('heading', { level: 1, name: /powtórzon/ })).toBeVisible();

		expect(leave('link', VALUES).cancel).not.toHaveBeenCalled();
		expect(leave('leave').cancel).not.toHaveBeenCalled();
		await expect.element(stopDialog()).not.toBeInTheDocument();
	});

	it('leaves the warning to the browser when the tab is closed during a session', async () => {
		await startAndAnswer();

		const navigation = leave('leave');

		expect(navigation.cancel).toHaveBeenCalled();
		await expect.element(stopDialog()).not.toBeInTheDocument();
	});

	it('asks before signing out of a running session', async () => {
		await startAndAnswer();

		await page.getByRole('button', { name: m.menu.signOut }).click();
		await expect.element(stopDialog()).toBeVisible();
		await stopDialog().getByRole('button', { name: m.review.keepGoing }).click();

		await expect.element(stopDialog()).not.toBeInTheDocument();
		expect(supabase.auth.signOut).not.toHaveBeenCalled();
		await page.getByRole('button', { name: m.menu.signOut }).click();
		await stopDialog().getByRole('button', { name: m.review.stop }).click();
		await vi.waitFor(() => expect(supabase.auth.signOut).toHaveBeenCalledOnce());
	});
});
