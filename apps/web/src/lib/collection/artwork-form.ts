import { emptyCategoryValues } from './category-values.ts';
import type { SelectOption } from '@study-atelier/ui';
import { m } from '#lib/i18n/index.ts';
import type { ImageCandidate } from '#lib/images/types.ts';
import type {
	ArtworkFormState,
	ArtworkImageInput,
	ArtworkInput,
	ArtworkRecord,
	ArtworkTypeCode
} from './types.ts';

export const ARTWORK_TYPE_CODES: readonly ArtworkTypeCode[] = [
	'architecture',
	'painting',
	'sculpture',
	'drawing',
	'printmaking',
	'applied_arts',
	'photography',
	'other'
];

export function artworkTypeOptions(): SelectOption[] {
	return ARTWORK_TYPE_CODES.map((code) => ({ value: code, label: m.artworkTypes[code] }));
}

export function emptyArtworkForm(): ArtworkFormState {
	return {
		title: '',
		values: emptyCategoryValues(),
		queries: { author: '', period: '', style: '', material: '', location: '' },
		authorUnknown: false,
		yearTo: '',
		toBeforeCommonEra: false,
		yearApproximate: false,
		typeCode: '',
		eraCode: null,
		notes: '',
		image: null
	};
}

export function artworkFormFromRecord(record: ArtworkRecord): ArtworkFormState {
	return {
		...emptyArtworkForm(),
		title: record.title,
		values: {
			author: record.authorUnknown ? [] : [...record.authors],
			period: record.period === null ? [] : [record.period],
			style: [...record.styles],
			material: [...record.materials],
			location: record.location === null ? [] : [record.location]
		},
		authorUnknown: record.authorUnknown,
		yearTo: record.yearTo === null ? '' : String(record.yearTo),
		toBeforeCommonEra: record.toBeforeCommonEra,
		yearApproximate: record.yearApproximate,
		typeCode: record.typeCode ?? '',
		eraCode: record.eraCode,
		notes: record.notes,
		image: record.image
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
		yearTo: parseYear(form.yearTo),
		toBeforeCommonEra: form.toBeforeCommonEra,
		yearApproximate: form.yearApproximate,
		typeCode: form.typeCode || null,
		eraCode: form.eraCode,
		period: form.values.period[0] ?? null,
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

export function artworkImageAlt(form: ArtworkFormState): string {
	const authors = form.authorUnknown ? [] : form.values.author;
	return [form.title.trim(), ...authors].filter((part) => part !== '').join(', ');
}

export function imageFromCandidate(candidate: ImageCandidate): ArtworkImageInput | null {
	if (!candidate.image) return null;
	return {
		kind: 'commons',
		wikidataId: candidate.wikidataId,
		file: candidate.image.file,
		licence: candidate.image.licence,
		licenceUrl: candidate.image.licenceUrl,
		attribution: candidate.image.attribution,
		width: candidate.image.width,
		height: candidate.image.height
	};
}
