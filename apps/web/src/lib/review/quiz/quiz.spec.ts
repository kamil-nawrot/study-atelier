import { describe, expect, it } from 'vitest';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { testReviewCard } from '#lib/testing/review/review.ts';
import { quizArtworks, sessionItems, shuffleQuiz } from './quiz.ts';
import type { SessionRow } from '#lib/review/types.ts';

const artworks = [1, 2, 3, 4, 5].map((number) => testArtwork(number, `Artwork ${number}`));
const byId = new Map<string, WallArtwork>(artworks.map((artwork) => [artwork.id, artwork]));

function sequence(...values: number[]): () => number {
	let index = 0;
	return () => values[index++ % values.length];
}

const imageQuiz: SessionRow = {
	artwork_id: 'artwork-1',
	mode: 'quiz_image',
	options: [
		{ artwork_id: 'artwork-2', label: 'Artwork 2', reason: 'author' },
		{ artwork_id: 'artwork-1', label: 'Artwork 1', right: true },
		{ artwork_id: 'artwork-3', label: 'Artwork 3' },
		{ artwork_id: 'artwork-4', label: 'Artwork 4', reason: 'style' }
	]
};

const pinQuiz: SessionRow = {
	artwork_id: 'artwork-2',
	mode: 'quiz_pin',
	options: [
		{ label: 'Nave' },
		{ label: 'Apse', right: true },
		{ label: 'Choir' },
		{ label: 'Portal' }
	],
	pin: {
		x: 0.25,
		y: 0.75,
		image: {
			id: 'image-2',
			source_wikidata_id: 'Q2',
			source_image_file: 'Artwork_2.jpg',
			source_image_licence: null,
			source_image_licence_url: null,
			source_image_attribution: null,
			own_image_path: null,
			own_image_url: null,
			image_width: 800,
			image_height: 600
		}
	}
};

describe('session items', () => {
	it('turns the rows of the database into review items with their cards and quizzes', () => {
		const card = testReviewCard('artwork-5', new Date(2026, 9, 16));
		const items = sessionItems(
			[
				imageQuiz,
				{
					artwork_id: 'artwork-5',
					mode: 'quiz_style',
					options: [
						{ label: 'Realism' },
						{ label: 'Baroque' },
						{ label: 'Caravaggism', right: true },
						{ label: 'Cubism' }
					]
				},
				{ artwork_id: 'artwork-3', mode: 'flashcard' }
			],
			byId,
			new Map([['artwork-5', card]])
		);

		expect(items.map((item) => [item.artwork.number, item.mode])).toEqual([
			[1, 'quiz_image'],
			[5, 'quiz_style'],
			[3, 'flashcard']
		]);
		expect(items[0].quiz?.answer).toBe(1);
		expect(items[0].quiz?.options[0]).toEqual({
			label: 'Artwork 2',
			artwork: byId.get('artwork-2'),
			reason: 'author'
		});
		expect(items[1].card).toBe(card);
		expect(items[1].quiz?.options[items[1].quiz.answer].label).toBe('Caravaggism');
		expect(quizArtworks(items)).toHaveLength(4);
	});

	it('leaves out artworks it does not know and makes a flashcard of a quiz it cannot show', () => {
		const items = sessionItems(
			[
				{ artwork_id: 'artwork-9', mode: 'flashcard' },
				{
					...imageQuiz,
					options: imageQuiz.options?.map((option, index) =>
						index === 0 ? { ...option, artwork_id: 'artwork-9' } : option
					)
				},
				{ ...imageQuiz, options: imageQuiz.options?.map((option) => ({ ...option, right: false })) }
			],
			byId,
			new Map()
		);

		expect(items.map((item) => [item.artwork.number, item.mode, item.quiz])).toEqual([
			[1, 'flashcard', undefined],
			[1, 'flashcard', undefined]
		]);
	});

	it('asks what a pinned detail is with the image and the place of the pin', () => {
		const [item] = sessionItems([pinQuiz], byId, new Map());

		expect(item.mode).toBe('quiz_pin');
		expect(item.quiz?.options[item.quiz.answer]).toEqual({ label: 'Apse' });
		expect(item.pin).toEqual({
			x: 0.25,
			y: 0.75,
			image: expect.objectContaining({ kind: 'commons', file: 'Artwork_2.jpg', id: 'image-2' })
		});
		expect(quizArtworks([item])).toEqual([]);
	});

	it('makes a flashcard of a pin question without a pin', () => {
		const items = sessionItems(
			[
				{ ...pinQuiz, pin: undefined },
				{
					...pinQuiz,
					pin: pinQuiz.pin && {
						...pinQuiz.pin,
						image: { ...pinQuiz.pin.image, source_wikidata_id: null, source_image_file: null }
					}
				}
			],
			byId,
			new Map()
		);

		expect(items.map((item) => [item.mode, item.pin])).toEqual([
			['flashcard', undefined],
			['flashcard', undefined]
		]);
	});

	it('keeps the right answer when the options are shuffled again', () => {
		const [item] = sessionItems([imageQuiz], byId, new Map());
		if (!item.quiz) throw new Error('No quiz');
		const shuffled = shuffleQuiz(item.quiz, sequence(0.9, 0.1, 0.5));

		expect(shuffled.options[shuffled.answer].artwork).toBe(byId.get('artwork-1'));
		expect(shuffled.options).toHaveLength(4);
	});
});
