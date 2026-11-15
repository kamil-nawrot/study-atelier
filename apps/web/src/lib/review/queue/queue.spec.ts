import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { endOfDay, retryLater, startOfDay, withExtraSteps } from './queue.ts';
import type { ReviewItem } from '#lib/review/types/review-item.ts';
import type { SessionStep } from '#lib/review/types/session-step.ts';

const now = new Date(2026, 9, 16, 9, 0);
const ERAS: EraCode[] = ['antiquity', 'middle_ages', 'early_modern', 'modern'];

function collection(
	count: number,
	overrides: (index: number) => Partial<WallArtwork> = () => ({})
): WallArtwork[] {
	return Array.from({ length: count }, (_, index) =>
		testArtwork(index + 1, `Artwork ${index + 1}`, {
			eraCode: ERAS[index % ERAS.length],
			...overrides(index)
		})
	);
}

describe('review queue', () => {
	it('bounds the day by the local midnight', () => {
		expect(startOfDay(now)).toEqual(new Date(2026, 9, 16));
		expect(endOfDay(now)).toEqual(new Date(2026, 9, 17));
	});

	it('brings an artwork back after three to five others', () => {
		const queue: ReviewItem[] = collection(10).map((artwork) => ({
			artwork,
			card: null,
			mode: 'flashcard'
		}));
		const again = { ...queue[1] };
		expect(retryLater(queue, 1, again, () => 0).indexOf(again)).toBe(5);
		expect(retryLater(queue, 1, again, () => 0.99).indexOf(again)).toBe(7);
		expect(retryLater(queue, 8, again, () => 0).indexOf(again)).toBe(10);
	});
});

describe('withExtraSteps', () => {
	const artworks = [1, 2, 3, 4].map((number) => testArtwork(number, `Artwork ${number}`));
	const items: ReviewItem[] = artworks.map((artwork) => ({
		artwork,
		card: null,
		mode: 'flashcard'
	}));
	const year: SessionStep = { mode: 'year', artwork: testArtwork(9, 'Dated'), card: null };

	it('never puts an extra question first and keeps every artwork in order', () => {
		const steps = withExtraSteps(items, [year, year, year], () => 0);

		expect(steps).toHaveLength(7);
		expect(steps[0].mode).toBe('flashcard');
		expect(
			steps.flatMap((step) => (step.mode === 'flashcard' ? [step.artwork.number] : []))
		).toEqual([1, 2, 3, 4]);
	});

	it('adds nothing to an empty session', () => {
		expect(withExtraSteps([], [year])).toEqual([]);
	});
});
