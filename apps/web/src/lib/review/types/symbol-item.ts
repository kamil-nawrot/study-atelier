import type { FragmentLens } from '#lib/pins/types/fragment-lens.ts';
import type { SymbolQuestionKind } from './symbol-question-kind.ts';
import type { ExtraCard } from './extra-card.ts';
import type { Quiz } from './quiz.ts';

export type SymbolItem = {
	mode: 'quiz_symbol';
	kind: SymbolQuestionKind;
	symbol: { id: string; name: string };
	card?: ExtraCard | null;
	key: string;
	lens?: FragmentLens;
	quiz: Quiz;
};
