import { describe, expect, it, vi } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { Holds } from '#lib/review/types/holds.ts';
import type { SessionStep } from '#lib/review/types/session-step.ts';
import { artworkIdsIn, skippedQueue, skipReplacement } from './question-skip.ts';

const jerome = testArtwork(1, 'Saint Jerome');
const david = testArtwork(2, 'David');
const quiz = { options: [{ label: 'A' }], answer: 0 };

function holds(extra: Partial<Holds>): Holds {
	return {
		artworks: new Set(),
		kinds: new Map(),
		terms: new Set(),
		symbols: new Set(),
		events: new Set(),
		...extra
	};
}

function definition(id: string): SessionStep {
	return {
		mode: 'quiz_definition',
		term: {
			id,
			name: id,
			kind: 'term' as const,
			category: 'painting',
			synonyms: [],
			forms: [],
			hasDefinition: true,
			definition: 'D'
		},
		quiz
	};
}

describe('question skip', () => {
	it('asks a flashcard of the artwork in place of a held kind', async () => {
		const fresh = vi.fn();
		const replacement = await skipReplacement(
			{ artwork: jerome, card: null, mode: 'quiz_pin', quiz },
			holds({ kinds: new Map([['artwork-1', new Set(['quiz_pin'])]]) }),
			{ reserve: [], queue: [], fresh }
		);

		expect(replacement).toEqual({ artwork: jerome, card: null, mode: 'flashcard' });
		expect(fresh).not.toHaveBeenCalled();
	});

	it('takes the next artwork of a fresh round in place of a wholly held one', async () => {
		const next = { artwork: david, card: null, mode: 'flashcard' as const };
		const replacement = await skipReplacement(
			{ artwork: jerome, card: null, mode: 'quiz_title', quiz },
			holds({ artworks: new Set(['artwork-1']) }),
			{ reserve: [], queue: [], fresh: vi.fn().mockResolvedValue(next) }
		);

		expect(replacement).toBe(next);
	});

	it('takes a term from the reserve that is neither asked nor held', async () => {
		const replacement = await skipReplacement(
			definition('t1'),
			holds({ terms: new Set(['t1', 't2']) }),
			{
				reserve: [definition('t2'), definition('t3'), definition('t4')],
				queue: [definition('t1'), definition('t3')],
				fresh: vi.fn()
			}
		);

		expect(replacement).toMatchObject({ term: { id: 't4' } });
	});

	it('drops a pair or a note gap without a replacement', async () => {
		await expect(
			skipReplacement(
				{ mode: 'quiz_pair', kind: 'author', key: 'k', asked: 'A', other: 'B', quiz },
				holds({ kinds: new Map([['artwork-1', new Set(['quiz_pair'])]]) }),
				{ reserve: [], queue: [], fresh: vi.fn() }
			)
		).resolves.toBeUndefined();
	});

	it('puts the replacement in place and leaves out the later questions that are held', () => {
		const queue: SessionStep[] = [
			{ artwork: david, card: null, mode: 'flashcard' },
			{ artwork: jerome, card: null, mode: 'quiz_title', quiz },
			{ mode: 'year', artwork: jerome, card: null },
			{ mode: 'year', artwork: david, card: null }
		];
		const next = { artwork: david, card: null, mode: 'quiz_title' as const, quiz };

		expect(skippedQueue(queue, 1, next, holds({ artworks: new Set(['artwork-1']) }))).toEqual([
			queue[0],
			next,
			queue[3]
		]);
		expect(skippedQueue(queue, 1, undefined, holds({}))).toEqual([queue[0], queue[2], queue[3]]);
		expect([...artworkIdsIn(queue)]).toEqual(['artwork-2', 'artwork-1']);
	});
});
