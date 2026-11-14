import type { PinFragment } from '#lib/pins/types/pin-fragment.ts';

export type SymbolPin = {
	pinId: string;
	artworkId: string;
	meaningId: string | null;
	fragment?: PinFragment;
};
