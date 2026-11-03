import { ERA_CODES, ERA_START_YEARS } from '#lib/catalogue/eras/eras.ts';
import { signedYear } from '#lib/catalogue/years/years.ts';
import type { ArtworkInput } from '#lib/artworks/types/artwork-input.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';

export type Dated = {
	eraCode: EraCode | null;
	yearFrom: number | null;
	yearTo: number | null;
};

function spanOf(code: EraCode): [number, number] {
	const index = ERA_CODES.indexOf(code);
	const next = ERA_CODES[index + 1];
	return [index === 0 ? -Infinity : ERA_START_YEARS[code], next ? ERA_START_YEARS[next] : Infinity];
}

export function yearOutsideEra({ eraCode, yearFrom, yearTo }: Dated): boolean {
	if (eraCode === null || yearTo === null) return false;
	const [start, end] = spanOf(eraCode);
	return yearTo < start || (yearFrom ?? yearTo) > end;
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
