import { describe, expect, it, vi } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { ReviewSession } from '#lib/review/review-session/review-session.svelte.ts';
import { roundSummary } from './round-summary.ts';

vi.mock('#lib/review/review-data/review-data.ts', () => ({
	recordReview: vi.fn().mockResolvedValue({}),
	recordRightAnswer: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({ supabase: {} }));

const start = new Date(2026, 9, 16, 9, 0);

describe('roundSummary', () => {
	it('sums up the artworks, the years and the orders of a round', async () => {
		const works = [1, 2, 3, 4].map((number) =>
			testArtwork(number, `Work ${number}`, { eraCode: 'early_modern', yearTo: 1500 + number * 50 })
		);
		const session = new ReviewSession(
			[
				{ artwork: works[0], card: null, mode: 'flashcard' },
				{ mode: 'year', artwork: works[1], card: null },
				{ mode: 'order', artworks: works }
			],
			new Map(),
			() => start,
			() => 0
		);
		session.reveal();
		await session.rate(3);
		await session.guess(1600);
		session.proceed();
		session.checkOrder(works);

		expect(roundSummary(session, 4)).toEqual({
			count: 1,
			minutes: 1,
			tomorrow: 4,
			groups: [{ rating: 3, artworks: [works[0]] }],
			free: false,
			years: { asked: 1, hit: 1 },
			orders: { asked: 1, right: 1 }
		});
	});

	it('expects nothing tomorrow after a free round', () => {
		const session = new ReviewSession(
			[],
			new Map(),
			() => start,
			() => 0,
			true
		);
		expect(roundSummary(session, 4).tomorrow).toBe(0);
	});
});
