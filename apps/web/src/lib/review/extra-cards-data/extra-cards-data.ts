import { NO_EXTRA_ROUND } from '#lib/review/extra-cards/extra-cards.ts';
import { startOfDay } from '#lib/review/queue/queue.ts';
import type { ExtraCard } from '#lib/review/types/extra-card.ts';
import type { ExtraRound } from '#lib/review/types/extra-round.ts';
import type { ReviewCard } from '#lib/review/types/review-card.ts';
import type { ReviewRating } from '#lib/review/types/review-rating.ts';
import type { ReviewState } from '#lib/review/types/review-state.ts';
import type { SymbolQuestionKind } from '#lib/review/types/symbol-question-kind.ts';
import type { EventQuestionKind } from '#lib/review/types/event-question-kind.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';

type CardRow = {
	id: string;
	glossary_entry_id: string | null;
	symbol_id: string | null;
	timeline_event_id: string | null;
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

type TermRow = { id: string; card: CardRow | null };

type SymbolRow = {
	symbol_id: string;
	pin_id: string;
	kind: SymbolQuestionKind;
	card: CardRow | null;
};

type EventRow = { id: string; kind: EventQuestionKind; card: CardRow | null };

type RoundRow = { terms: TermRow[]; symbols: SymbolRow[]; events?: EventRow[] };

export type ExtraMode =
	'quiz_definition' | `symbol_${SymbolQuestionKind}` | `event_${EventQuestionKind}`;

export type ExtraAnswerInput = {
	mode: ExtraMode;
	correct: boolean;
	rating?: ReviewRating;
	answerMs: number;
	wrongAnswer?: string;
};

function cardOf(row: CardRow): ExtraCard {
	return {
		id: row.id,
		termId: row.glossary_entry_id,
		symbolId: row.symbol_id,
		eventId: row.timeline_event_id,
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

export const RESERVE = 2;

export async function loadExtraRound(dayStart: Date): Promise<ExtraRound> {
	const { data, error } = await supabase.rpc('extra_round', {
		day_start: dayStart.toISOString(),
		reserve: RESERVE
	});
	if (error || !data) return NO_EXTRA_ROUND;
	const round = data as unknown as RoundRow;
	return {
		terms: round.terms.map((term) => ({ id: term.id, card: term.card && cardOf(term.card) })),
		symbols: round.symbols.map((symbol) => ({
			symbolId: symbol.symbol_id,
			pinId: symbol.pin_id,
			kind: symbol.kind,
			card: symbol.card && cardOf(symbol.card)
		})),
		events: (round.events ?? []).map((event) => ({
			eventId: event.id,
			kind: event.kind,
			card: event.card && cardOf(event.card)
		}))
	};
}

export async function recordExtraReview(
	target: { termId: string } | { symbolId: string } | { eventId: string },
	card: ReviewCard,
	answer: ExtraAnswerInput,
	now: Date = new Date()
): Promise<boolean> {
	const { error } = await supabase.rpc('record_extra_review', {
		target_term: 'termId' in target ? target.termId : (null as unknown as string),
		target_symbol: 'symbolId' in target ? target.symbolId : (null as unknown as string),
		...('eventId' in target ? { target_event: target.eventId } : {}),
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
			rating: answer.rating ?? (answer.correct ? 2 : 1),
			correct: answer.correct,
			answer_ms: Math.max(0, Math.round(answer.answerMs)),
			...(answer.wrongAnswer === undefined ? {} : { wrong_answer: answer.wrongAnswer })
		},
		day_start: startOfDay(now).toISOString()
	});
	return !error;
}
