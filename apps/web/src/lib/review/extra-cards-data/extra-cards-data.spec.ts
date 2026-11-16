import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { NO_EXTRA_ROUND } from '#lib/review/extra-cards/extra-cards.ts';
import { loadExtraRound, recordExtraReview } from './extra-cards-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { rpc: vi.fn(), auth: { signOut: vi.fn() } }
}));

const rpc = vi.mocked(supabase.rpc);

const cardRow = (id: string, target: { term?: string; symbol?: string }): unknown => ({
	id,
	glossary_entry_id: target.term ?? null,
	symbol_id: target.symbol ?? null,
	due: '2026-11-18T08:00:00.000Z',
	stability: 2,
	difficulty: 5,
	state: 2,
	reps: 1,
	lapses: 0,
	scheduled_days: 2,
	learning_steps: 0,
	last_review: '2026-11-16T08:00:00.000Z',
	last_rating: 2
});

describe('extra cards data', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('loads the terms and symbols the database picked for the day, with their cards', async () => {
		rpc.mockResolvedValue({
			data: {
				terms: [
					{ id: 'term-1', card: cardRow('card-1', { term: 'term-1' }) },
					{ id: 'term-2', card: null }
				],
				symbols: [
					{
						symbol_id: 'symbol-1',
						pin_id: 'pin-1',
						kind: 'meaning',
						card: cardRow('card-2', { symbol: 'symbol-1' })
					}
				]
			},
			error: null
		} as never);

		const round = await loadExtraRound(new Date('2026-11-16T00:00:00.000Z'));

		expect(rpc).toHaveBeenCalledWith('extra_round', {
			day_start: '2026-11-16T00:00:00.000Z',
			reserve: 2
		});
		expect(round.terms[0].card).toMatchObject({ id: 'card-1', reps: 1, lastRating: 2 });
		expect(round.terms[0].card?.due).toEqual(new Date('2026-11-18T08:00:00.000Z'));
		expect(round.terms[1]).toEqual({ id: 'term-2', card: null });
		expect(round.symbols).toEqual([
			expect.objectContaining({ symbolId: 'symbol-1', pinId: 'pin-1', kind: 'meaning' })
		]);
		expect(round.symbols[0].card?.symbolId).toBe('symbol-1');
	});

	it('asks no term or symbol when the round cannot be loaded', async () => {
		rpc.mockResolvedValue({ data: null, error: { message: 'Failed to fetch' } } as never);

		await expect(loadExtraRound(new Date())).resolves.toBe(NO_EXTRA_ROUND);
	});

	it('records an answer of a symbol with its card and the start of the day', async () => {
		rpc.mockResolvedValue({ data: true, error: null } as never);
		const now = new Date('2026-11-16T15:00:00');

		await recordExtraReview(
			{ symbolId: 'symbol-1' },
			{
				artworkId: '',
				due: new Date('2026-11-17T15:00:00.000Z'),
				stability: 1,
				difficulty: 6,
				state: 2,
				reps: 1,
				lapses: 1,
				scheduledDays: 1,
				learningSteps: 0,
				lastReview: now,
				lastRating: 1
			},
			{ mode: 'symbol_meaning', correct: false, answerMs: 2400.6, wrongAnswer: 'Purity' },
			now
		);

		expect(rpc).toHaveBeenCalledWith('record_extra_review', {
			target_term: null,
			target_symbol: 'symbol-1',
			card: expect.objectContaining({ due: '2026-11-17T15:00:00.000Z', lapses: 1 }),
			answer: {
				mode: 'symbol_meaning',
				rating: 1,
				correct: false,
				answer_ms: 2401,
				wrong_answer: 'Purity'
			},
			day_start: new Date('2026-11-16T00:00:00').toISOString()
		});
	});
});
