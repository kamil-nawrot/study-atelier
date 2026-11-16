import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { NO_EXTRA_CARDS } from '#lib/review/extra-cards/extra-cards.ts';
import { loadExtraCards, recordExtraReview } from './extra-cards-data.ts';

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: { rpc: vi.fn(), from: vi.fn(), auth: { signOut: vi.fn() } }
}));

const rpc = vi.mocked(supabase.rpc);
const from = vi.mocked(supabase.from);

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

function answer(results: Record<string, unknown>): void {
	from.mockImplementation((table: string) => {
		const query: Record<string, ReturnType<typeof vi.fn>> = {};
		for (const name of ['select', 'eq', 'neq', 'order']) query[name] = vi.fn(() => query);
		query.range = vi.fn().mockResolvedValue(results[table]);
		return query as never;
	});
}

describe('extra cards data', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('loads the cards of terms and symbols and when each symbol kind was asked last', async () => {
		answer({
			extra_cards: {
				data: [cardRow('card-1', { term: 'term-1' }), cardRow('card-2', { symbol: 'symbol-1' })],
				error: null
			},
			extra_review_log: {
				data: [
					{ card_id: 'card-2', mode: 'symbol_symbol', reviewed_at: '2026-11-10T08:00:00.000Z' },
					{ card_id: 'card-2', mode: 'symbol_symbol', reviewed_at: '2026-11-12T08:00:00.000Z' },
					{ card_id: 'card-2', mode: 'symbol_meaning', reviewed_at: '2026-11-11T08:00:00.000Z' },
					{ card_id: 'card-9', mode: 'symbol_meaning', reviewed_at: '2026-11-11T08:00:00.000Z' }
				],
				error: null
			}
		});

		const cards = await loadExtraCards();

		expect(cards.terms.get('term-1')).toMatchObject({ id: 'card-1', reps: 1, lastRating: 2 });
		expect(cards.terms.get('term-1')?.due).toEqual(new Date('2026-11-18T08:00:00.000Z'));
		expect(cards.symbols.get('symbol-1')?.id).toBe('card-2');
		expect(cards.askedKinds.get('symbol-1')).toEqual({
			symbol: new Date('2026-11-12T08:00:00.000Z').getTime(),
			meaning: new Date('2026-11-11T08:00:00.000Z').getTime()
		});
	});

	it('treats every term and symbol as new when the cards cannot be loaded', async () => {
		answer({
			extra_cards: { data: null, error: { message: 'Failed to fetch' } },
			extra_review_log: { data: [], error: null }
		});

		await expect(loadExtraCards()).resolves.toBe(NO_EXTRA_CARDS);
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
