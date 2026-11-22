import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { StoredFlag } from '#lib/backroom/types/stored-flag.ts';
import type { SessionStep } from '#lib/review/types/session-step.ts';
import { heldStep, holdsOf, NO_HOLDS, withoutHeld } from './holds.ts';

function flag(extra: Partial<StoredFlag>): StoredFlag {
	return {
		id: 'flag',
		reason: 'data',
		comment: null,
		artworkId: null,
		termId: null,
		symbolId: null,
		eventId: null,
		imageId: null,
		pinId: null,
		imageNumber: null,
		question: null,
		holds: true,
		mode: null,
		...extra
	};
}

const jerome = testArtwork(1, 'Saint Jerome');
const david = testArtwork(2, 'David');
const quiz = { options: [{ label: 'A' }], answer: 0 };
const term = { id: 't1', name: 'Vanitas', kind: 'term' as const, category: 'painting' as const, synonyms: [], forms: [] };

describe('holds', () => {
	it('holds a whole artwork for its image and only one kind for a pin or two fitting answers', () => {
		const holds = holdsOf([
			flag({ artworkId: 'artwork-1', reason: 'image' }),
			flag({ artworkId: 'artwork-2', reason: 'pin' }),
			flag({ artworkId: 'artwork-2', reason: 'answers', mode: 'quiz_author' }),
			flag({ artworkId: 'artwork-3', reason: 'data', holds: false }),
			flag({ termId: 't1', reason: 'hidden' }),
			flag({ symbolId: 's1', reason: 'meaning' })
		]);

		expect([...holds.artworks]).toEqual(['artwork-1']);
		expect([...(holds.kinds.get('artwork-2') ?? [])]).toEqual(['quiz_pin', 'quiz_author']);
		expect([...holds.terms]).toEqual(['t1']);
		expect([...holds.symbols]).toEqual(['s1']);
	});

	it('asks a flashcard in place of a held kind and drops a wholly held artwork', () => {
		const holds = holdsOf([
			flag({ artworkId: 'artwork-1', reason: 'image' }),
			flag({ artworkId: 'artwork-2', reason: 'pin' })
		]);

		expect(
			heldStep({ artwork: jerome, card: null, mode: 'quiz_title', quiz }, holds)
		).toBeUndefined();
		expect(heldStep({ artwork: david, card: null, mode: 'quiz_pin', quiz }, holds)).toEqual({
			artwork: david,
			card: null,
			mode: 'flashcard'
		});
		expect(heldStep({ artwork: david, card: null, mode: 'quiz_title', quiz }, holds)).toMatchObject(
			{
				mode: 'quiz_title'
			}
		);
		expect(
			heldStep(
				{ artwork: david, card: null, mode: 'quiz_style', quiz },
				holdsOf([flag({ artworkId: 'artwork-2', reason: 'answers', mode: 'quiz_style' })])
			)
		).toEqual({ artwork: david, card: null, mode: 'flashcard' });
	});

	it('leaves out held terms, symbols and the questions about held artworks', () => {
		const holds = holdsOf([
			flag({ termId: 't1', reason: 'hidden' }),
			flag({ symbolId: 's1', reason: 'meaning' }),
			flag({ artworkId: 'artwork-1', reason: 'image' })
		]);
		const steps: SessionStep[] = [
			{ mode: 'quiz_definition', term: { ...term, hasDefinition: true, definition: 'D' }, quiz },
			{ mode: 'quiz_symbol', kind: 'symbol', symbol: { id: 's1', name: 'Skull' }, key: 'k', quiz },
			{
				mode: 'note_gap',
				artwork: david,
				term: { ...term, hasDefinition: true },
				segments: [],
				quiz
			},
			{ mode: 'year', artwork: jerome, card: null },
			{ mode: 'order', artworks: [david, jerome] },
			{ mode: 'year', artwork: david, card: null }
		];

		expect(withoutHeld(steps, holds)).toEqual([{ mode: 'year', artwork: david, card: null }]);
		expect(withoutHeld(steps, NO_HOLDS)).toHaveLength(6);
	});

	it('leaves out the question about a held event', () => {
		const holds = holdsOf([flag({ eventId: 'war', reason: 'date' })]);
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

		expect([...holds.events]).toEqual(['war']);
		expect(heldStep(step, holds)).toBeUndefined();
		expect(heldStep(step, NO_HOLDS)).toBe(step);
	});
});
