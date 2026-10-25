import type { EraCode } from '#lib/catalogue/types/era-code.ts';

export type ReviewScope =
	| { kind: 'all' }
	| { kind: 'era'; code: EraCode }
	| { kind: 'period'; name: string }
	| { kind: 'style'; name: string };
