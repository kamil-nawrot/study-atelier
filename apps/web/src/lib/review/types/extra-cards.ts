import type { ExtraCard } from './extra-card.ts';
import type { SymbolQuestionKind } from './symbol-question-kind.ts';

export type ExtraCards = {
	terms: ReadonlyMap<string, ExtraCard>;
	symbols: ReadonlyMap<string, ExtraCard>;
	askedKinds: ReadonlyMap<string, Partial<Record<SymbolQuestionKind, number>>>;
};
