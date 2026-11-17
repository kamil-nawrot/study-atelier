import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { SessionStep } from '#lib/review/types/session-step.ts';
import { stepGroups } from './flag-groups.ts';

const jerome = testArtwork(1, 'Saint Jerome');
const david = testArtwork(2, 'David', { hasImage: false });
const term = {
	id: 'term-1',
	name: 'Vanitas',
	category: 'painting' as const,
	synonyms: [],
	forms: []
};

function reasonsOf(step: SessionStep): [string, string[]][] {
	return stepGroups(step).map((group) => [group.item.id, group.reasons]);
}

describe('flag groups of a review question', () => {
	it('offers the image, data, note and other on a flashcard', () => {
		expect(reasonsOf({ artwork: jerome, card: null, mode: 'flashcard' })).toEqual([
			['artwork-1', ['image', 'data', 'note', 'other']]
		]);
	});

	it('adds the answers to a quiz and leaves the image out of an artwork without one', () => {
		const quiz = { options: [{ label: 'Caravaggio' }, { label: 'Titian' }], answer: 0 };
		expect(reasonsOf({ artwork: david, card: null, mode: 'quiz_author', quiz })).toEqual([
			['artwork-2', ['data', 'note', 'answers', 'other']]
		]);
	});

	it('points the pin of a pin question at its image and place', () => {
		const [group] = stepGroups({
			artwork: jerome,
			card: null,
			mode: 'quiz_pin',
			quiz: { options: [{ label: 'Vanitas' }], answer: 0 },
			pin: {
				x: 0.25,
				y: 0.5,
				image: { kind: 'url', url: 'https://example.com/a.jpg', width: 1, height: 1, id: 'image-1' }
			}
		});
		expect(group.reasons).toEqual(['image', 'pin', 'data', 'note', 'answers', 'other']);
		expect(group.item).toMatchObject({ pin: { imageId: 'image-1', x: 0.25, y: 0.5 } });
	});

	it('gives every artwork of an image question its own group once', () => {
		const quiz = {
			options: [
				{ label: 'Saint Jerome', artwork: jerome },
				{ label: 'David', artwork: david }
			],
			answer: 0
		};
		expect(reasonsOf({ artwork: jerome, card: null, mode: 'quiz_image', quiz })).toEqual([
			['artwork-1', ['image', 'data', 'note', 'other']],
			['artwork-2', ['data', 'other']]
		]);
	});

	it('puts a hidden answer of a definition and a note gap on the term', () => {
		expect(
			reasonsOf({
				mode: 'quiz_definition',
				term: { ...term, hasDefinition: true, definition: 'A still life' },
				quiz: { options: [], answer: 0 }
			})
		).toEqual([['term-1', ['hidden', 'definition', 'answers', 'other']]]);
		expect(
			reasonsOf({
				mode: 'note_gap',
				artwork: jerome,
				term: { ...term, hasDefinition: false },
				segments: [],
				quiz: { options: [], answer: 0 }
			})
		).toEqual([
			['term-1', ['hidden', 'answers', 'other']],
			['artwork-1', ['note', 'other']]
		]);
	});

	it('flags the meaning of a symbol', () => {
		expect(
			reasonsOf({
				mode: 'quiz_symbol',
				kind: 'meaning',
				symbol: { id: 'symbol-1', name: 'Skull' },
				key: 'pin-1:meaning',
				quiz: { options: [], answer: 0 }
			})
		).toEqual([['symbol-1', ['meaning', 'answers', 'other']]]);
	});

	it('keeps two fitting answers of a confused pair on the asked artwork', () => {
		const quiz = {
			options: [
				{ label: 'David', artwork: david },
				{ label: 'Saint Jerome', artwork: jerome }
			],
			answer: 1
		};
		expect(
			reasonsOf({
				mode: 'quiz_pair',
				kind: 'author',
				key: 'k',
				asked: 'Caravaggio',
				other: 'Titian',
				quiz
			})
		).toEqual([
			['artwork-2', ['data', 'other']],
			['artwork-1', ['image', 'data', 'answers', 'other']]
		]);
	});

	it('flags the artwork of a relation question and the artworks among its answers', () => {
		const quiz = { options: [{ label: 'David', artwork: david }, { label: 'Titian' }], answer: 0 };
		expect(
			reasonsOf({ mode: 'quiz_relation', question: 'studyFrom', key: 'k', artwork: jerome, quiz })
		).toEqual([
			['artwork-1', ['image', 'data', 'answers', 'other']],
			['artwork-2', ['data', 'other']]
		]);
	});

	it('flags every artwork of a year and an order question', () => {
		expect(reasonsOf({ mode: 'year', artwork: jerome, card: null })).toEqual([
			['artwork-1', ['image', 'data', 'other']]
		]);
		expect(reasonsOf({ mode: 'order', artworks: [jerome, david] })).toEqual([
			['artwork-1', ['image', 'data', 'other']],
			['artwork-2', ['data', 'other']]
		]);
	});

	it('flags the date of a Kalendarium event', () => {
		const step: SessionStep = {
			mode: 'event_year',
			kind: 'start',
			event: {
				id: 'war',
				name: 'Wojna trzydziestoletnia',
				yearFrom: 1618,
				yearTo: 1648,
				yearApproximate: false,
				description: '',
				source: null
			},
			card: null
		};

		expect(stepGroups(step)).toEqual([
			{
				item: { kind: 'event', id: 'war', name: 'Wojna trzydziestoletnia' },
				reasons: ['date', 'other']
			}
		]);
	});
});
