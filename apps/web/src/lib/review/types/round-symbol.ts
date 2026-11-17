import type { ExtraCard } from './extra-card.ts';
import type { SymbolQuestionKind } from './symbol-question-kind.ts';

export type RoundSymbol = {
	symbolId: string;
	pinId: string;
	kind: SymbolQuestionKind;
	card: ExtraCard | null;
};
