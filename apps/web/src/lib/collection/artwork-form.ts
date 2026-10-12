import { emptyCategoryValues } from './category-values.ts';
import type { ArtworkFormState, ArtworkInput } from './types.ts';

export function emptyArtworkForm(): ArtworkFormState {
	return {
		title: '',
		values: emptyCategoryValues(),
		queries: { author: '', period: '', style: '', material: '', location: '' },
		authorUnknown: false,
		year: '',
		beforeCommonEra: false,
		yearApproximate: false,
		typeCode: null,
		notes: '',
		image: null
	};
}

export function parseYear(text: string): number | null {
	const year = text.trim();
	if (year === '') return null;
	return /^\d+$/.test(year) ? Number(year) : Number.NaN;
}

export function artworkInputFromForm(form: ArtworkFormState): ArtworkInput {
	return {
		title: form.title,
		authors: form.authorUnknown ? [] : [...form.values.author],
		authorUnknown: form.authorUnknown,
		year: parseYear(form.year),
		beforeCommonEra: form.beforeCommonEra,
		yearApproximate: form.yearApproximate,
		typeCode: form.typeCode,
		periods: [...form.values.period],
		styles: [...form.values.style],
		materials: [...form.values.material],
		location: form.values.location[0] ?? null,
		notes: form.notes,
		image: form.image
	};
}

export function formHasChanges(form: ArtworkFormState, saved: ArtworkFormState): boolean {
	return JSON.stringify(form) !== JSON.stringify(saved);
}

export function canSearchImage(form: ArtworkFormState): boolean {
	return form.title.trim() !== '' && (form.authorUnknown || form.values.author.length > 0);
}
