import { m } from '#lib/i18n/index.ts';
import { parseYear } from './artwork-form.ts';
import { signedYear } from './format.ts';
import type { AuthorDetails, AuthorFieldErrors, AuthorFormState } from './types.ts';

export function emptyAuthorDetails(): AuthorDetails {
	return { image: null, birthYear: null, deathYear: null, yearsApproximate: false, sortName: null };
}

export function authorFormFromDetails(details: AuthorDetails): AuthorFormState {
	return {
		image: details.image,
		birthYear: details.birthYear === null ? '' : String(Math.abs(details.birthYear)),
		birthBeforeCommonEra: details.birthYear !== null && details.birthYear < 0,
		deathYear: details.deathYear === null ? '' : String(Math.abs(details.deathYear)),
		deathBeforeCommonEra: details.deathYear !== null && details.deathYear < 0,
		yearsApproximate: details.yearsApproximate,
		sortByOther: details.sortName !== null,
		sortName: details.sortName ?? ''
	};
}

function yearError(year: number | null): string | undefined {
	return year !== null && !(Number.isInteger(year) && year >= 1)
		? m.artworkErrors.yearInvalid
		: undefined;
}

export function validateAuthorForm(form: AuthorFormState): AuthorFieldErrors {
	const birth = parseYear(form.birthYear);
	const death = parseYear(form.deathYear);
	const errors: AuthorFieldErrors = {};
	const birthError = yearError(birth);
	const deathError = yearError(death);
	if (birthError) errors.birthYear = birthError;
	if (deathError) errors.deathYear = deathError;
	if (birthError || deathError || birth === null || death === null) return errors;
	const born = form.birthBeforeCommonEra ? -birth : birth;
	const died = form.deathBeforeCommonEra ? -death : death;
	if (died < born) errors.deathYear = m.valueForm.lifeYearsOrder;
	return errors;
}

export function authorDetailsFromForm(form: AuthorFormState): AuthorDetails {
	const birthYear = signedYear(parseYear(form.birthYear), form.birthBeforeCommonEra);
	const deathYear = signedYear(parseYear(form.deathYear), form.deathBeforeCommonEra);
	const sortName = form.sortName.trim();
	return {
		image: form.image,
		birthYear,
		deathYear,
		yearsApproximate: form.yearsApproximate && (birthYear !== null || deathYear !== null),
		sortName: form.sortByOther && sortName !== '' ? sortName : null
	};
}
