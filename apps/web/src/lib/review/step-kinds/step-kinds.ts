import type { DefinitionItem } from '#lib/review/types/definition-item.ts';
import type { NoteGapItem } from '#lib/review/types/note-gap-item.ts';
import type { PairItem } from '#lib/review/types/pair-item.ts';
import type { Quiz } from '#lib/review/types/quiz.ts';
import type { RelationItem } from '#lib/review/types/relation-item.ts';
import type { ReviewItem } from '#lib/review/types/review-item.ts';
import type { SessionStep } from '#lib/review/types/session-step.ts';
import type { SymbolItem } from '#lib/review/types/symbol-item.ts';

const EXTRA_MODES = new Set([
	'quiz_definition',
	'quiz_symbol',
	'note_gap',
	'quiz_pair',
	'quiz_relation',
	'year',
	'order',
	'event_year'
]);

export type ExtraQuizItem = DefinitionItem | SymbolItem | NoteGapItem | PairItem | RelationItem;

export type ExtraMode = ExtraQuizItem['mode'] | 'event_year';

export type ExtraAnswer = { mode: ExtraMode; right: boolean };

export function artworkItem(step: SessionStep | undefined): step is ReviewItem {
	return step !== undefined && !EXTRA_MODES.has(step.mode);
}

export function extraQuiz(step: SessionStep): step is ExtraQuizItem {
	return (
		step.mode === 'quiz_definition' ||
		step.mode === 'quiz_symbol' ||
		step.mode === 'note_gap' ||
		step.mode === 'quiz_pair' ||
		step.mode === 'quiz_relation'
	);
}

export function extraKey(item: ExtraQuizItem): string {
	if (item.mode === 'quiz_symbol' || item.mode === 'quiz_pair' || item.mode === 'quiz_relation') {
		return item.key;
	}
	return item.mode === 'note_gap' ? `${item.artwork.id}:${item.term.id}` : item.term.id;
}

export function pickedWrong(quiz: Quiz, choice: number): string | undefined {
	return choice === quiz.answer ? undefined : quiz.options[choice]?.label;
}

export function scoreOf(answers: readonly boolean[]): { asked: number; right: number } {
	return { asked: answers.length, right: answers.filter(Boolean).length };
}

export function extraScoreOf(
	answers: readonly ExtraAnswer[],
	mode: ExtraMode
): { asked: number; right: number } {
	return scoreOf(answers.filter((answer) => answer.mode === mode).map((answer) => answer.right));
}

export function yearScore(answers: readonly { rating: number }[]): { asked: number; hit: number } {
	return { asked: answers.length, hit: answers.filter((answer) => answer.rating > 1).length };
}
