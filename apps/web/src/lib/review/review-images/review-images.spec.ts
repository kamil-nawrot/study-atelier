import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { ReviewItem } from '#lib/review/types/review-item.ts';
import { withItemImages } from './review-images.ts';

const resolved = (artwork: WallArtwork): WallArtwork => ({
	...artwork,
	title: `${artwork.title}!`
});

describe('withItemImages', () => {
	it('gives the artwork of a flashcard its resolved image', () => {
		const item: ReviewItem = {
			artwork: testArtwork(1, 'Mona Lisa'),
			card: null,
			mode: 'flashcard'
		};

		const shown = withItemImages(item, resolved);

		expect(shown.artwork.title).toBe('Mona Lisa!');
		expect(shown.quiz).toBeUndefined();
	});

	it('gives every quiz option with an artwork its resolved image and keeps the others', () => {
		const item: ReviewItem = {
			artwork: testArtwork(1, 'Mona Lisa'),
			card: null,
			mode: 'flashcard',
			quiz: {
				answer: 0,
				options: [
					{ label: 'Leonardo' },
					{ label: 'Night Watch', artwork: testArtwork(2, 'Night Watch') }
				]
			}
		};

		const shown = withItemImages(item, resolved);

		expect(shown.quiz?.options.map((option) => option.artwork?.title)).toEqual([
			undefined,
			'Night Watch!'
		]);
		expect(shown.quiz?.answer).toBe(0);
	});
});
