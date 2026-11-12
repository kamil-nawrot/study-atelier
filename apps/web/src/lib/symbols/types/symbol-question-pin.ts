import type { PinFragment } from '#lib/pins/types/pin-fragment.ts';

export type SymbolQuestionPin = {
	pinId: string;
	symbolName: string;
	meaning?: { id: string; text: string; persons: string[] };
	fragment: PinFragment;
};
