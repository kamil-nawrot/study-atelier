import { NO_EXTRA_CARDS } from '#lib/review/extra-cards/extra-cards.ts';
import { startOfDay } from '#lib/review/queue/queue.ts';
import type { ExtraCard } from '#lib/review/types/extra-card.ts';
import type { ExtraCards } from '#lib/review/types/extra-cards.ts';
import type { ReviewCard } from '#lib/review/types/review-card.ts';
import type { ReviewRating } from '#lib/review/types/review-rating.ts';
import type { ReviewState } from '#lib/review/types/review-state.ts';
import type { SymbolQuestionKind } from '#lib/review/types/symbol-question-kind.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';

type CardRow = {
	id: string;
	glossary_entry_id: string | null;
	symbol_id: string | null;
	due: string;
	stability: number;
	difficulty: number;
	state: number;
	reps: number;
	lapses: number;
	scheduled_days: number;
	learning_steps: number;
	last_review: string | null;
	last_rating: number | null;
};

type AnswerRow = { card_id: string; mode: string; reviewed_at: string };

export type ExtraMode = 'quiz_definition' | `symbol_${SymbolQuestionKind}`;

export type ExtraAnswerInput = {
	mode: ExtraMode;
	correct: boolean;
	answerMs: number;
	wrongAnswer?: string;
};

const CARD_COLUMNS =
	'id, glossary_entry_id, symbol_id, due, stability, difficulty, state, reps, lapses, scheduled_days, learning_steps, last_review, last_rating';

function cardOf(row: CardRow): ExtraCard {
	return {
		id: row.id,
		termId: row.glossary_entry_id,
		symbolId: row.symbol_id,
		due: new Date(row.due),
		stability: row.stability,
		difficulty: row.difficulty,
		state: row.state as ReviewState,
		reps: row.reps,
		lapses: row.lapses,
		scheduledDays: row.scheduled_days,
		learningSteps: row.learning_steps,
		lastReview: row.last_review ? new Date(row.last_review) : null,
		lastRating: row.last_rating as ReviewRating | null
	};
}

function askedKindsOf(
	answers: readonly AnswerRow[],
	cards: readonly ExtraCard[]
): Map<string, Partial<Record<SymbolQuestionKind, number>>> {
	const symbolOf = new Map(
		cards.flatMap((card) => (card.symbolId ? [[card.id, card.symbolId]] : []))
	);
	const asked = new Map<string, Partial<Record<SymbolQuestionKind, number>>>();
	for (const answer of answers) {
		const symbolId = symbolOf.get(answer.card_id);
		if (!symbolId) continue;
		const kind = answer.mode.replace('symbol_', '') as SymbolQuestionKind;
		const at = new Date(answer.reviewed_at).getTime();
		const kinds = asked.get(symbolId) ?? {};
		kinds[kind] = Math.max(kinds[kind] ?? at, at);
		asked.set(symbolId, kinds);
	}
	return asked;
}

export async function loadExtraCards(): Promise<ExtraCards> {
	const [cardRows, answerRows] = await Promise.all([
		fetchAll<CardRow>((from, to) =>
			supabase.from('extra_cards').select(CARD_COLUMNS).order('id').range(from, to)
		),
		fetchAll<AnswerRow>((from, to) =>
			supabase
				.from('extra_review_log')
				.select('card_id, mode, reviewed_at')
				.eq('practice', false)
				.neq('mode', 'quiz_definition')
				.order('id')
				.range(from, to)
		)
	]);
	if (cardRows.error || answerRows.error) return NO_EXTRA_CARDS;
	const cards = cardRows.rows.map(cardOf);
	return {
		terms: new Map(cards.flatMap((card) => (card.termId ? [[card.termId, card]] : []))),
		symbols: new Map(cards.flatMap((card) => (card.symbolId ? [[card.symbolId, card]] : []))),
		askedKinds: askedKindsOf(answerRows.rows, cards)
	};
}

export async function recordExtraReview(
	target: { termId: string } | { symbolId: string },
	card: ReviewCard,
	answer: ExtraAnswerInput,
	now: Date = new Date()
): Promise<void> {
	await supabase.rpc('record_extra_review', {
		target_term: 'termId' in target ? target.termId : (null as unknown as string),
		target_symbol: 'symbolId' in target ? target.symbolId : (null as unknown as string),
		card: {
			due: card.due.toISOString(),
			stability: card.stability,
			difficulty: card.difficulty,
			state: card.state,
			reps: card.reps,
			lapses: card.lapses,
			scheduled_days: card.scheduledDays,
			learning_steps: card.learningSteps,
			last_review: card.lastReview?.toISOString() ?? null
		},
		answer: {
			mode: answer.mode,
			rating: answer.correct ? 2 : 1,
			correct: answer.correct,
			answer_ms: Math.max(0, Math.round(answer.answerMs)),
			...(answer.wrongAnswer === undefined ? {} : { wrong_answer: answer.wrongAnswer })
		},
		day_start: startOfDay(now).toISOString()
	});
}
