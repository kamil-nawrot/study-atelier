import { m } from '#lib/i18n/index.ts';
import { parseYear } from '#lib/artworks/artwork-form/artwork-form.ts';
import { yearError } from '#lib/artworks/artwork-record/artwork-record.ts';
import { signedYear } from '#lib/catalogue/years/years.ts';
import type { AuthorDetails } from '#lib/values/types/author-details.ts';
import type { AuthorFieldErrors } from '#lib/values/types/author-field-errors.ts';
import type { AuthorFormState } from '#lib/values/types/author-form-state.ts';

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

export function validateAuthorForm(form: AuthorFormState): AuthorFieldErrors {
	const birth = parseYear(form.birthYear);
	const death = parseYear(form.deathYear);
	const errors: AuthorFieldErrors = {};
	const birthError = birth === null ? undefined : yearError(birth, form.birthBeforeCommonEra);
	const deathError = death === null ? undefined : yearError(death, form.deathBeforeCommonEra);
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
