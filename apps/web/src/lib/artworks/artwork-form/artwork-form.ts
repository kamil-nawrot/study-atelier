import { emptyCategoryValues } from '#lib/card-index/category-values/category-values.ts';
import type { ImageCandidate } from '#lib/images/types.ts';
import type { ArtworkFormState, ArtworkInput, ArtworkRecord, OwnFieldDefinition } from '#lib/collection/types.ts';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { OwnEntries } from '#lib/catalogue/types/own-entries.ts';
import type { OwnEntry } from '#lib/catalogue/types/own-entry.ts';

export const MAX_ARTWORK_IMAGES = 5;

function emptyEntry(field: OwnFieldDefinition): OwnEntry {
	if (field.kind === 'list') return [];
	return field.kind === 'flag' ? false : '';
}

function ownEntries(fields: readonly OwnFieldDefinition[], saved: OwnEntries = {}): OwnEntries {
	return Object.fromEntries(
		fields.map((field) => {
			const entry = saved[field.id];
			const fits =
				field.kind === 'list'
					? Array.isArray(entry)
					: typeof entry === (field.kind === 'flag' ? 'boolean' : 'string');
			return [field.id, fits ? structuredClone(entry) : emptyEntry(field)];
		})
	);
}

export function emptyArtworkForm(fields?: readonly OwnFieldDefinition[]): ArtworkFormState {
	return {
		title: '',
		values: emptyCategoryValues(),
		queries: { author: '', period: '', style: '', material: '', location: '' },
		authorUnknown: false,
		spanMode: false,
		yearFrom: '',
		fromBeforeCommonEra: false,
		yearTo: '',
		toBeforeCommonEra: false,
		yearApproximate: false,
		typeCode: '',
		eraCode: null,
		notes: '',
		image: null,
		images: [],
		...(fields ? { own: ownEntries(fields) } : {}),
		ownQueries: Object.fromEntries(
			(fields ?? []).filter((field) => field.kind === 'list').map((field) => [field.id, ''])
		)
	};
}

export function artworkFormFromRecord(
	record: ArtworkRecord,
	fields?: readonly OwnFieldDefinition[]
): ArtworkFormState {
	return {
		...emptyArtworkForm(fields),
		...(fields ? { own: ownEntries(fields, record.own) } : {}),
		title: record.title,
		values: {
			author: record.authorUnknown ? [] : [...record.authors],
			period: record.period === null ? [] : [record.period],
			style: [...record.styles],
			material: [...record.materials],
			location: record.location === null ? [] : [record.location]
		},
		authorUnknown: record.authorUnknown,
		spanMode: record.yearFrom !== null,
		yearFrom: record.yearFrom === null ? '' : String(record.yearFrom),
		fromBeforeCommonEra: record.fromBeforeCommonEra,
		yearTo: record.yearTo === null ? '' : String(record.yearTo),
		toBeforeCommonEra: record.toBeforeCommonEra,
		yearApproximate: record.yearApproximate,
		typeCode: record.typeCode ?? '',
		eraCode: record.eraCode,
		notes: record.notes,
		image: record.image,
		images: [...record.images]
	};
}

export function parseYear(text: string): number | null {
	const year = text.trim();
	if (year === '') return null;
	return /^\d+$/.test(year) ? Number(year) : Number.NaN;
}

export function artworkInputFromForm(form: ArtworkFormState): ArtworkInput {
	const [image = null, ...images] = [form.image, ...form.images].filter(
		(item): item is ArtworkImageInput => item !== null
	);
	return {
		title: form.title,
		authors: form.authorUnknown ? [] : [...form.values.author],
		authorUnknown: form.authorUnknown,
		yearFrom: form.spanMode ? parseYear(form.yearFrom) : null,
		fromBeforeCommonEra: form.spanMode && form.fromBeforeCommonEra,
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
		image,
		images,
		...(form.own ? { own: structuredClone(form.own) } : {})
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

export function imageFromCandidate(candidate: ImageCandidate): ArtworkImageInput {
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
