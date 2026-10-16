import { describe, expect, it } from 'vitest';
import type { WallArtwork } from '#lib/collection/types.ts';
import { testArtwork } from '#lib/testing/artworks.ts';
import {
	buildQuiz,
	canAsk,
	closeness,
	quizArtworks,
	shuffleQuiz,
	similarity,
	withQuizzes
} from './quiz.ts';
import type { ReviewItem } from './types.ts';

const answer = testArtwork(1, 'Girl with a Pearl Earring', {
	authors: ['Johannes Vermeer'],
	styles: ['Dutch Golden Age'],
	period: 'Baroque',
	typeCode: 'painting',
	eraCode: 'early_modern',
	yearTo: 1665,
	location: 'Mauritshuis'
});

function artwork(number: number, overrides: Partial<WallArtwork> = {}): WallArtwork {
	return testArtwork(number, `Artwork ${number}`, {
		authors: [`Painter ${number}`],
		yearTo: 1200,
		...overrides
	});
}

function sequence(...values: number[]): () => number {
	let index = 0;
	return () => values[index++ % values.length];
}

describe('similarity', () => {
	it('weighs what an artwork shares with the answer', () => {
		expect(similarity(answer, artwork(2, { styles: ['Dutch Golden Age'] }))).toBe(4);
		expect(similarity(answer, artwork(2, { authors: ['Johannes Vermeer'] }))).toBe(3);
		expect(similarity(answer, artwork(2, { period: 'Baroque', typeCode: 'painting' }))).toBe(4);
		expect(
			similarity(
				answer,
				artwork(2, { eraCode: 'early_modern', yearTo: 1700, location: 'Mauritshuis' })
			)
		).toBe(3);
		expect(similarity(answer, artwork(2, { yearTo: 1716 }))).toBe(0);
		expect(similarity(answer, artwork(2))).toBe(0);
	});

	it('names the author first, then the style, then the period as why a pick was close', () => {
		expect(
			closeness(answer, artwork(2, { authors: ['Johannes Vermeer'], styles: ['Dutch Golden Age'] }))
		).toBe('author');
		expect(closeness(answer, artwork(2, { styles: ['Dutch Golden Age'], period: 'Baroque' }))).toBe(
			'style'
		);
		expect(closeness(answer, artwork(2, { period: 'Baroque' }))).toBe('period');
		expect(closeness(answer, artwork(2, { typeCode: 'painting' }))).toBeUndefined();
	});
});

describe('buildQuiz', () => {
	it('offers three of the eight closest artworks next to the answer', () => {
		const close = Array.from({ length: 8 }, (_, index) =>
			artwork(index + 2, { styles: ['Dutch Golden Age'] })
		);
		const far = Array.from({ length: 10 }, (_, index) => artwork(index + 20));
		const quiz = buildQuiz(answer, 'quiz_title', [answer, ...far, ...close], Math.random);

		expect(quiz?.options).toHaveLength(4);
		expect(quiz?.options[quiz.answer].artwork).toBe(answer);
		const others = quiz?.options.filter((_, index) => index !== quiz.answer) ?? [];
		expect(others.every((option) => close.includes(option.artwork as WallArtwork))).toBe(true);
		expect(others.every((option) => option.reason === 'style')).toBe(true);
	});

	it('never offers an artwork without an image or with the same title', () => {
		const pool = [
			answer,
			artwork(2, { hasImage: false, authors: ['Johannes Vermeer'] }),
			testArtwork(3, ' girl with a pearl earring', { authors: ['Johannes Vermeer'] }),
			artwork(4),
			artwork(5),
			artwork(6)
		];
		const quiz = buildQuiz(answer, 'quiz_image', pool, sequence(0.5));
		const titles = quiz?.options.map((option) => option.label).sort();

		expect(titles).toEqual(['Artwork 4', 'Artwork 5', 'Artwork 6', answer.title]);
	});

	it('offers each title once', () => {
		const pool = [
			answer,
			artwork(2),
			artwork(3),
			testArtwork(4, 'Artwork 2'),
			testArtwork(5, 'Artwork 3')
		];

		expect(canAsk(answer, 'quiz_title', pool)).toBe(false);
		expect(buildQuiz(answer, 'quiz_title', pool)).toBeUndefined();
	});

	it('asks for the style among other styles of the collection', () => {
		const pool = [
			answer,
			artwork(2, { styles: ['Mannerism'], period: 'Baroque' }),
			artwork(3, { styles: ['Caravaggism', 'Dutch Golden Age'] }),
			artwork(4, { styles: ['Rococo'] }),
			artwork(5, { styles: ['Dutch Golden Age'] })
		];
		const quiz = buildQuiz(answer, 'quiz_style', pool, sequence(0.3));

		expect(quiz?.options[quiz.answer].label).toBe('Dutch Golden Age');
		expect(quiz?.options.map((option) => option.label).sort()).toEqual([
			'Caravaggism',
			'Dutch Golden Age',
			'Mannerism',
			'Rococo'
		]);
	});

	it('asks for the style only when the artwork has one and four styles exist', () => {
		const pool = [
			answer,
			artwork(2, { styles: ['Mannerism'] }),
			artwork(3, { styles: ['Rococo'] }),
			artwork(4, { styles: ['Dutch Golden Age'] })
		];

		expect(canAsk(answer, 'quiz_style', pool)).toBe(false);
		expect(canAsk(answer, 'quiz_style', [...pool, artwork(5, { styles: ['Cubism'] })])).toBe(true);
		expect(canAsk(artwork(9), 'quiz_style', [...pool, artwork(5, { styles: ['Cubism'] })])).toBe(
			false
		);
	});
});

describe('session quizzes', () => {
	const pool = [answer, artwork(2), artwork(3), artwork(4)];

	it('builds a quiz for each quiz item and turns the others into flashcards', () => {
		const items: ReviewItem[] = [
			{ artwork: answer, card: null, mode: 'quiz_image' },
			{ artwork: answer, card: null, mode: 'quiz_style' },
			{ artwork: answer, card: null, mode: 'flashcard' }
		];
		const built = withQuizzes(items, pool);

		expect(built.map((item) => item.mode)).toEqual(['quiz_image', 'flashcard', 'flashcard']);
		expect(built[0].quiz?.options).toHaveLength(4);
		expect(quizArtworks(built)).toHaveLength(4);
	});

	it('keeps the right answer when the options are shuffled again', () => {
		const quiz = buildQuiz(answer, 'quiz_title', pool);
		if (!quiz) throw new Error('No quiz');
		const shuffled = shuffleQuiz(quiz, sequence(0.9, 0.1, 0.5));

		expect(shuffled.options[shuffled.answer].artwork).toBe(answer);
		expect(shuffled.options).toHaveLength(4);
	});
});
