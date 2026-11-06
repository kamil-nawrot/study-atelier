import { yearOutsideEra as outsideEra } from '#lib/catalogue/eras/eras.ts';
import { signedYear } from '#lib/catalogue/years/years.ts';
import type { ArtworkInput } from '#lib/artworks/types/artwork-input.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';

export type Dated = {
	eraCode: EraCode | null;
	yearFrom: number | null;
	yearTo: number | null;
};

export function yearOutsideEra(dated: Dated): boolean {
	return outsideEra(dated);
}

export function datedOf(input: ArtworkInput): Dated {
	return {
		eraCode: input.eraCode,
		yearFrom: signedYear(input.yearFrom, input.fromBeforeCommonEra),
		yearTo: signedYear(input.yearTo, input.toBeforeCommonEra)
	};
}

export function sameEraAndYears(a: Dated, b: Dated): boolean {
	return a.eraCode === b.eraCode && a.yearFrom === b.yearFrom && a.yearTo === b.yearTo;
}
