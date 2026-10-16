import { describe, expect, it } from 'vitest';
import type { WallArtwork } from '#lib/collection/types.ts';
import { testArtwork } from '#lib/testing/artworks.ts';
import { testReviewCard } from '#lib/testing/review.ts';
import { quizArtworks, sessionItems, shuffleQuiz } from './quiz.ts';
import type { SessionRow } from './types.ts';

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

	it('keeps the right answer when the options are shuffled again', () => {
		const [item] = sessionItems([imageQuiz], byId, new Map());
		if (!item.quiz) throw new Error('No quiz');
		const shuffled = shuffleQuiz(item.quiz, sequence(0.9, 0.1, 0.5));

		expect(shuffled.options[shuffled.answer].artwork).toBe(byId.get('artwork-1'));
		expect(shuffled.options).toHaveLength(4);
	});
});
