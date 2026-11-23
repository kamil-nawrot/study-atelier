import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import { flagQuestion } from './flag-question.ts';

const jerome = testArtwork(12, 'Saint Jerome');
const quiz = { options: [{ label: 'Caravaggio' }, { label: 'Titian' }], answer: 0 };

describe('flag question', () => {
	it('remembers the question with the right answer and a wrong pick', () => {
		expect(flagQuestion({ artwork: jerome, card: null, mode: 'quiz_author', quiz }, 1)).toEqual({
			mode: 'quiz_author',
			text: m.review.quiz.authorQuestion,
			answer: 'Caravaggio',
			picked: 'Titian'
		});
	});

	it('leaves the pick out before the answer and after a right one', () => {
		expect(
			flagQuestion({ artwork: jerome, card: null, mode: 'quiz_author', quiz })
		).not.toHaveProperty('picked');
		expect(
			flagQuestion({ artwork: jerome, card: null, mode: 'quiz_author', quiz }, 0)
		).not.toHaveProperty('picked');
	});

	it('names the artwork in an image and a relation question', () => {
		expect(flagQuestion({ artwork: jerome, card: null, mode: 'quiz_image', quiz }).text).toBe(
			`${m.review.quiz.imageQuestion.start} Saint Jerome${m.review.quiz.imageQuestion.end}`
		);
		expect(
			flagQuestion({ mode: 'quiz_relation', question: 'copyFrom', key: 'k', artwork: jerome, quiz })
				.text
		).toBe(`${m.review.quiz.relationQuestions.copyFrom} Saint Jerome?`);
	});

	it('remembers the artwork of a note gap', () => {
		expect(
			flagQuestion({
				mode: 'note_gap',
				artwork: jerome,
				term: {
					id: 't',
					name: 'Vanitas',
					kind: 'term' as const,
					category: 'painting',
					synonyms: [],
					forms: [],
					hasDefinition: false
				},
				segments: [],
				quiz
			})
		).toMatchObject({ mode: 'note_gap', text: m.review.quiz.noteQuestion, note: 12 });
	});

	it('asks a year and an order question without answers', () => {
		expect(flagQuestion({ mode: 'year', artwork: jerome, card: null })).toEqual({
			mode: 'year',
			text: m.review.year.question
		});
		expect(flagQuestion({ mode: 'order', artworks: [jerome] }).text).toBe(m.review.order.question);
	});
});
