import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { timeArtworks, timeQuestions, withTimeImages } from './time-questions.ts';

const today = new Date('2026-11-04T12:00:00.000Z');
const works = [1, 2, 3, 4].map((number) =>
	testArtwork(number, `Artwork ${number}`, { eraCode: 'early_modern', yearTo: 1500 + number * 40 })
);
const byId = new Map(works.map((artwork) => [artwork.id, artwork]));

describe('timeQuestions', () => {
	it('takes the year and the order questions of a session and every artwork they show', () => {
		const steps = timeQuestions(
			[
				{ artwork_id: works[0].id, mode: 'flashcard' },
				{ artwork_id: works[1].id, mode: 'year', card: null },
				{ mode: 'order', artwork_ids: works.map((artwork) => artwork.id).reverse() }
			],
			byId,
			today
		);

		expect(steps.map((step) => step.mode)).toEqual(['year', 'order']);
		expect(timeArtworks(steps).map((artwork) => artwork.number)).toEqual([2, 4, 3, 2, 1]);
	});

	it('gives every artwork of a question its resolved image', () => {
		const resolved = (artwork: WallArtwork): WallArtwork => ({
			...artwork,
			title: `${artwork.title}!`
		});
		const [year, order] = timeQuestions(
			[
				{ artwork_id: works[1].id, mode: 'year', card: null },
				{ mode: 'order', artwork_ids: works.map((artwork) => artwork.id) }
			],
			byId,
			today
		).map((step) => withTimeImages(step, resolved));

		expect(timeArtworks([year, order]).every((artwork) => artwork.title.endsWith('!'))).toBe(true);
	});
});
