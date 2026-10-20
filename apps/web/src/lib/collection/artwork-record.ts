import { m } from '#lib/i18n/index.ts';
import { removeOwnImage } from '#lib/images/own-image.ts';
import type { Json } from '#lib/database.types.ts';
import { failureMessage } from '#lib/auth/expired-session.svelte.ts';
import { supabase } from '#lib/supabase.ts';
import { valuesOf } from './artwork-values.ts';
import { signedYear } from './format.ts';
import { artworkErrorMessage } from './errors.ts';
import {
	IMAGE_COLUMNS,
	imageColumns,
	imageOf,
	storedImage,
	uploadPath,
	withPreview,
	type ImageRow,
	type StoredImage
} from './image-record.ts';
import type {
	ArtworkFieldErrors,
	ArtworkInput,
	ArtworkValueRow,
	ArtworkRecord,
	ArtworkTypeCode,
	CategoryCode,
	EraCode,
	ExistingArtwork,
	LoadArtworkResult,
	SaveArtworkResult
} from './types.ts';

type ArtworkRecordRow = {
	id: string;
	record_number: number;
	title: string;
	author_unknown: boolean;
	year_from: number | null;
	year_to: number | null;
	year_approximate: boolean;
	type_code: ArtworkTypeCode | null;
	era_code: EraCode | null;
	notes: string | null;
	favourite: boolean;
	artwork_values: ArtworkValueRow[];
	artwork_images: (ImageRow & { position: number })[];
} & ImageRow;

type StoredInput = Omit<ArtworkInput, 'image'> & { image: StoredImage | null };

const RECORD_COLUMNS = [
	'id',
	'record_number',
	'title',
	'author_unknown',
	'year_from',
	'year_to',
	'year_approximate',
	'type_code',
	'era_code',
	'notes',
	'favourite',
	...IMAGE_COLUMNS,
	'artwork_values(position, category_values(category_code, name))',
	`artwork_images(position, ${IMAGE_COLUMNS.join(', ')})`
].join(', ');

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

function names(values: string[]): string[] {
	return values.map((value) => value.trim()).filter((value) => value !== '');
}

function isYear(year: number): boolean {
	return Number.isInteger(year) && year >= 1;
}

function endsInOrder(input: ArtworkInput): boolean {
	const from = signedYear(input.yearFrom, input.fromBeforeCommonEra);
	const to = signedYear(input.yearTo, input.toBeforeCommonEra);
	return from === null || to === null || from <= to;
}

export function validateArtwork(input: ArtworkInput): ArtworkFieldErrors {
	const errors: ArtworkFieldErrors = {};
	if (!input.title.trim()) errors.title = m.artworkErrors.titleRequired;
	if (!input.authorUnknown && names(input.authors).length === 0) {
		errors.authors = m.artworkErrors.authorRequired;
	}
	if (input.yearTo === null) {
		if (input.yearFrom !== null) errors.yearTo = m.artworkErrors.spanEndRequired;
		else if (input.toBeforeCommonEra || input.yearApproximate)
			errors.yearTo = m.artworkErrors.yearRequired;
	} else if (!isYear(input.yearTo)) {
		errors.yearTo = m.artworkErrors.yearInvalid;
	}
	if (input.yearFrom === null) {
		if (input.fromBeforeCommonEra) errors.yearFrom = m.artworkErrors.yearRequired;
	} else if (!isYear(input.yearFrom)) {
		errors.yearFrom = m.artworkErrors.yearInvalid;
	} else if (input.yearTo !== null && !errors.yearTo && !endsInOrder(input)) {
		errors.yearTo = m.artworkErrors.spanOrder;
	}
	return errors;
}

function storedYearFrom(input: ArtworkInput): number | null {
	const from = signedYear(input.yearFrom, input.fromBeforeCommonEra);
	return from === signedYear(input.yearTo, input.toBeforeCommonEra) ? null : from;
}

function artworkColumns(input: StoredInput): Record<string, Json> {
	return {
		title: input.title.trim(),
		author_unknown: input.authorUnknown,
		year_from: storedYearFrom(input),
		year_to: signedYear(input.yearTo, input.toBeforeCommonEra),
		year_approximate: input.yearTo !== null && input.yearApproximate,
		type_code: input.typeCode,
		era_code: input.eraCode,
		notes: input.notes.trim() || null,
		...imageColumns(input.image)
	};
}

function valuesByCategory(input: ArtworkInput): Record<CategoryCode, string[]> {
	return {
		author: input.authorUnknown ? [] : names(input.authors),
		period: names(input.period === null ? [] : [input.period]),
		style: names(input.styles),
		material: names(input.materials),
		location: names(input.location === null ? [] : [input.location])
	};
}

export async function saveArtwork(
	input: ArtworkInput,
	existing?: ExistingArtwork
): Promise<SaveArtworkResult> {
	const fieldErrors = validateArtwork(input);
	if (Object.keys(fieldErrors).length > 0) return { saved: false, fieldErrors };

	const stored: StoredImage[] = [];
	const newUploads: string[] = [];
	for (const image of [input.image, ...input.images]) {
		if (image === null) continue;
		const result = await storedImage(image);
		if (result.error !== undefined) {
			await Promise.all(newUploads.map((path) => removeOwnImage(path)));
			return { saved: false, error: result.error, fieldErrors };
		}
		if (result.image === null) continue;
		stored.push(result.image);
		const path = image.kind === 'file' ? uploadPath(result.image) : null;
		if (path) newUploads.push(path);
	}
	const [main = null, ...others] = stored;

	const { data, error, status } = await supabase
		.rpc('save_artwork', {
			artwork: artworkColumns({ ...input, image: main }),
			values_by_category: valuesByCategory(input),
			existing_id: existing?.id,
			extra_images: others.map(imageColumns) as unknown as Json
		})
		.single();
	if (error) {
		if (error.code) await Promise.all(newUploads.map((path) => removeOwnImage(path)));
		return {
			saved: false,
			error: await failureMessage(
				{ code: error.code, message: error.message, status },
				artworkErrorMessage
			),
			fieldErrors
		};
	}

	const kept = new Set(stored.map(uploadPath));
	const previous = existing ? [existing.image, ...existing.images].map(uploadPath) : [];
	await Promise.all(
		previous.flatMap((path) => (path && !kept.has(path) ? [removeOwnImage(path)] : []))
	);

	return { saved: true, id: data.id, number: data.record_number };
}

function artworkRecordFromRow(row: ArtworkRecordRow): ArtworkRecord {
	return {
		id: row.id,
		number: row.record_number,
		favourite: row.favourite,
		title: row.title,
		authors: valuesOf(row.artwork_values, 'author'),
		authorUnknown: row.author_unknown,
		yearFrom: row.year_from === null ? null : Math.abs(row.year_from),
		fromBeforeCommonEra: row.year_from !== null && row.year_from < 0,
		yearTo: row.year_to === null ? null : Math.abs(row.year_to),
		toBeforeCommonEra: row.year_to !== null && row.year_to < 0,
		yearApproximate: row.year_approximate,
		typeCode: row.type_code,
		eraCode: row.era_code,
		period: valuesOf(row.artwork_values, 'period')[0] ?? null,
		styles: valuesOf(row.artwork_values, 'style'),
		materials: valuesOf(row.artwork_values, 'material'),
		location: valuesOf(row.artwork_values, 'location')[0] ?? null,
		notes: row.notes ?? '',
		image: imageOf(row),
		images: [...(row.artwork_images ?? [])]
			.sort((first, second) => first.position - second.position)
			.flatMap((image) => imageOf(image) ?? [])
	};
}

export async function loadArtwork(number: number): Promise<LoadArtworkResult> {
	const { data, error } = await supabase
		.from('artworks')
		.select(RECORD_COLUMNS)
		.eq('record_number', number)
		.is('deleted_at', null)
		.maybeSingle();
	if (error) return { error: artworkErrorMessage(error) };
	if (!data) return { error: m.artworkErrors.notFound, notFound: true };
	const artwork = artworkRecordFromRow(data as unknown as ArtworkRecordRow);
	const [image, ...images] = await Promise.all(
		[artwork.image, ...artwork.images].map((item) => withPreview(item))
	);
	return {
		artwork: {
			...artwork,
			image,
			images: images.filter((item): item is NonNullable<typeof item> => item !== null)
		}
	};
}
