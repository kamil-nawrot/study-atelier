import type { DefinitionItem } from '#lib/review/types/definition-item.ts';
import type { NoteGapItem } from '#lib/review/types/note-gap-item.ts';
import type { Quiz } from '#lib/review/types/quiz.ts';
import type { ReviewItem } from '#lib/review/types/review-item.ts';
import type { SessionStep } from '#lib/review/types/session-step.ts';
import type { SymbolItem } from '#lib/review/types/symbol-item.ts';

const EXTRA_MODES = new Set(['quiz_definition', 'quiz_symbol', 'note_gap', 'year', 'order']);

export function artworkItem(step: SessionStep | undefined): step is ReviewItem {
	return step !== undefined && !EXTRA_MODES.has(step.mode);
}

export function extraKey(item: DefinitionItem | SymbolItem | NoteGapItem): string {
	if (item.mode === 'quiz_symbol') return item.key;
	return item.mode === 'note_gap' ? `${item.artwork.id}:${item.term.id}` : item.term.id;
}

export function pickedWrong(quiz: Quiz, choice: number): string | undefined {
	return choice === quiz.answer ? undefined : quiz.options[choice]?.label;
}

export function scoreOf(answers: readonly boolean[]): { asked: number; right: number } {
	return { asked: answers.length, right: answers.filter(Boolean).length };
}
