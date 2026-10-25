import { m } from '#lib/i18n/i18n.ts';
import { signedYear } from '#lib/catalogue/years/years.ts';
import type { ArtworkFieldErrors } from '#lib/artworks/types/artwork-field-errors.ts';
import type { ArtworkInput } from '#lib/artworks/types/artwork-input.ts';
import type { YearsInput } from '#lib/artworks/types/years-input.ts';

export function emptyArtworkInput(): ArtworkInput {
	return {
		title: '',
		authors: [],
		authorUnknown: false,
		yearFrom: null,
		fromBeforeCommonEra: false,
		yearTo: null,
		toBeforeCommonEra: false,
		yearApproximate: false,
		typeCode: null,
		eraCode: null,
		period: null,
		styles: [],
		materials: [],
		location: null,
		notes: '',
		image: null,
		images: []
	};
}

export function names(values: string[]): string[] {
	return values.map(oneLine).filter((value) => value !== '');
}

export const EARLIEST_YEAR = 3_000_000;
export const LATEST_YEAR = 2500;

export function yearError(year: number, beforeCommonEra: boolean): string | undefined {
	if (!Number.isInteger(year) || year < 1) return m.artworkErrors.yearInvalid;
	if (beforeCommonEra && year > EARLIEST_YEAR) return m.artworkErrors.yearTooEarly;
	if (!beforeCommonEra && year > LATEST_YEAR) return m.artworkErrors.yearTooLate;
	return undefined;
}

export function isStoredYear(year: number): boolean {
	return Number.isInteger(year) && year !== 0 && year >= -EARLIEST_YEAR && year <= LATEST_YEAR;
}

type YearsErrors = {
	yearFrom?: string;
	yearTo?: string;
};

function endsInOrder(input: YearsInput): boolean {
	const from = signedYear(input.yearFrom, input.fromBeforeCommonEra);
	const to = signedYear(input.yearTo, input.toBeforeCommonEra);
	return from === null || to === null || from <= to;
}

export function validateYears(input: YearsInput): YearsErrors {
	const errors: YearsErrors = {};
	if (input.yearTo === null) {
		if (input.yearFrom !== null) errors.yearTo = m.artworkErrors.spanEndRequired;
		else if (input.toBeforeCommonEra || input.yearApproximate)
			errors.yearTo = m.artworkErrors.yearRequired;
	} else {
		const error = yearError(input.yearTo, input.toBeforeCommonEra);
		if (error) errors.yearTo = error;
	}
	if (input.yearFrom === null) {
		if (input.fromBeforeCommonEra) errors.yearFrom = m.artworkErrors.yearRequired;
	} else if (yearError(input.yearFrom, input.fromBeforeCommonEra)) {
		errors.yearFrom = yearError(input.yearFrom, input.fromBeforeCommonEra);
	} else if (input.yearTo !== null && !errors.yearTo && !endsInOrder(input)) {
		errors.yearTo = m.artworkErrors.spanOrder;
	}
	return errors;
}

export function validateArtwork(input: ArtworkInput): ArtworkFieldErrors {
	const errors: ArtworkFieldErrors = {};
	if (!input.title.trim()) errors.title = m.artworkErrors.titleRequired;
	if (!input.authorUnknown && names(input.authors).length === 0) {
		errors.authors = m.artworkErrors.authorRequired;
	}
	return { ...errors, ...validateYears(input) };
}

const CONTROL_CHARACTERS = /\p{Cc}/gu;

export function oneLine(text: string): string {
	return text.replace(CONTROL_CHARACTERS, ' ').trim();
}
