import type { ArtworkInput } from '#lib/artworks/types/artwork-input.ts';

export type YearsInput = Pick<
	ArtworkInput,
	'yearFrom' | 'fromBeforeCommonEra' | 'yearTo' | 'toBeforeCommonEra' | 'yearApproximate'
>;
