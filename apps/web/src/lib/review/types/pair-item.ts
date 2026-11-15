import type { PairKind } from './pair-kind.ts';
import type { Quiz } from './quiz.ts';

export type PairItem = {
	mode: 'quiz_pair';
	kind: PairKind;
	key: string;
	asked: string;
	other: string;
	quiz: Quiz;
};
