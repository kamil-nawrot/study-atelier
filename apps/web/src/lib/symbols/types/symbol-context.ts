import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';

export type SymbolContext =
	| { kind: 'value'; valueId: string; category: CategoryCode; name: string }
	| { kind: 'era'; eraCode: EraCode; name: string }
	| { kind: 'artwork'; artworkId: string; number: number; name: string }
	| { kind: 'person'; entryId: string; name: string }
	| { kind: 'text'; name: string };
