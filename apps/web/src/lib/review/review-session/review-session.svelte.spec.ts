import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { recordReview } from '#lib/review/review-data/review-data.ts';
import { ReviewSession } from './review-session.svelte.ts';
import type { ReviewItem } from '#lib/review/types.ts';

vi.mock('#lib/review/review-data/review-data.ts', () => ({ recordReview: vi.fn() }));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: {} }));

const start = new Date(2026, 9, 16, 9, 0);

function items(count: number): ReviewItem[] {
	return Array.from({ length: count }, (_, index) => ({
		artwork: testArtwork(index + 1, `Artwork ${index + 1}`),
		card: null,
		mode: 'flashcard'
	}));
}

function session(count: number, clock: { now: Date }): ReviewSession {
	return new ReviewSession(
		items(count),
		new Map(),
		() => clock.now,
		() => 0
	);
}

describe('ReviewSession', () => {
	beforeEach(() => {
		vi.mocked(recordReview).mockReset().mockResolvedValue({});
	});

	it('rates only a revealed card and saves the new state with the time it took', async () => {
		const clock = { now: start };
		const review = session(2, clock);

		await review.rate(3);
		expect(recordReview).not.toHaveBeenCalled();

		review.reveal();
		clock.now = new Date(start.getTime() + 4000);
		await review.rate(3);

		expect(recordReview).toHaveBeenCalledWith(
			expect.objectContaining({ artworkId: 'artwork-1', reps: 1 }),
			{ mode: 'flashcard', rating: 3, answerMs: 4000 }
		);
		expect(review.position).toBe(1);
		expect(review.revealed).toBe(false);
		expect(review.cards.get('artwork-1')?.reps).toBe(1);
	});

	it('brings a forgotten artwork back after three to five others', async () => {
		const clock = { now: start };
		const review = session(6, clock);

		review.reveal();
		await review.rate(1);

		expect(review.queue.map((item) => item.artwork.number)).toEqual([1, 2, 3, 4, 1, 5, 6]);
		expect(review.queue[4].card?.reps).toBe(1);
	});

	it('keeps the card on screen with the error when the answer is not saved', async () => {
		vi.mocked(recordReview).mockResolvedValue({ error: 'Not saved.' });
		const clock = { now: start };
		const review = session(2, clock);

		review.reveal();
		await review.rate(2);

		expect(review.error).toBe('Not saved.');
		expect(review.position).toBe(0);
		expect(review.revealed).toBe(true);
		expect(review.answers).toHaveLength(0);
	});

	it('finishes after the last card and counts the artworks seen for the first time', async () => {
		const clock = { now: start };
		const review = session(2, clock);

		for (const rating of [3, 2] as const) {
			review.reveal();
			await review.rate(rating);
		}
		clock.now = new Date(start.getTime() + 150_000);

		expect(review.finished).toBe(true);
		expect(review.started).toBe(2);
		expect(review.minutes).toBe(3);
		expect(review.answers.map((answer) => answer.rating)).toEqual([3, 2]);
	});

	it('saves a quiz answer at once and moves on only when asked', async () => {
		const clock = { now: start };
		const review = new ReviewSession(
			quizItems(2),
			new Map(),
			() => clock.now,
			() => 0
		);

		await review.answer(1);

		expect(recordReview).toHaveBeenCalledWith(
			expect.objectContaining({ artworkId: 'artwork-1' }),
			expect.objectContaining({ mode: 'quiz_title', rating: 2, correct: true })
		);
		expect(review.chosen).toBe(1);
		expect(review.position).toBe(0);

		await review.answer(2);
		expect(recordReview).toHaveBeenCalledTimes(1);

		review.proceed();
		expect(review.position).toBe(1);
		expect(review.chosen).toBeUndefined();
	});

	it('counts a wrong quiz answer as not known and asks it again later', async () => {
		const clock = { now: start };
		const review = new ReviewSession(
			quizItems(6),
			new Map(),
			() => clock.now,
			() => 0
		);

		await review.answer(0);

		expect(recordReview).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ rating: 1, correct: false })
		);
		const retry = review.queue[4];
		expect(retry.artwork.number).toBe(1);
		expect(retry.quiz?.options[retry.quiz.answer].label).toBe('Artwork 1');
	});

	it('does not rate a quiz like a flashcard', async () => {
		const review = new ReviewSession(
			quizItems(1),
			new Map(),
			() => start,
			() => 0
		);

		review.reveal();
		await review.rate(3);

		expect(recordReview).not.toHaveBeenCalled();
	});

	it('saves nothing in a free session and still asks a forgotten artwork again', async () => {
		const clock = { now: start };
		const review = new ReviewSession(
			items(6),
			new Map(),
			() => clock.now,
			() => 0,
			true
		);

		review.reveal();
		await review.rate(1);
		await review.answer(0);

		expect(recordReview).not.toHaveBeenCalled();
		expect(review.position).toBe(1);
		expect(review.answers).toHaveLength(1);
		expect(review.queue.map((item) => item.artwork.number)).toEqual([1, 2, 3, 4, 1, 5, 6]);
	});
});

function quizItems(count: number): ReviewItem[] {
	return items(count).map((item) => ({
		...item,
		mode: 'quiz_title',
		quiz: {
			answer: 1,
			options: ['Other A', item.artwork.title, 'Other B', 'Other C'].map((label) => ({ label }))
		}
	}));
}
