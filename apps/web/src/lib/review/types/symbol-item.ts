import type { FragmentLens } from '#lib/pins/types/fragment-lens.ts';
import type { SymbolQuestionKind } from './symbol-question-kind.ts';
import type { Quiz } from './quiz.ts';

export type SymbolItem = {
	mode: 'quiz_symbol';
	kind: SymbolQuestionKind;
	key: string;
	lens?: FragmentLens;
	quiz: Quiz;
};
