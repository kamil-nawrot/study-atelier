import type { PairKind } from './pair-kind.ts';

export type ConfusedPair = {
	kind: PairKind;
	first: string;
	second: string;
};
