import { beforeEach, describe, expect, it, vi } from 'vitest';
import { testArtwork } from '#lib/testing/artworks.ts';
import { recordReview } from './review-data.ts';
import { ReviewSession } from './review-session.svelte.ts';
import type { ReviewItem } from './types.ts';

vi.mock('./review-data.ts', () => ({ recordReview: vi.fn() }));

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
});
