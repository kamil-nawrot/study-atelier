import { m } from '#lib/i18n/index.ts';
import { ownImageUrl, removeOwnImage, uploadOwnImage } from '#lib/images/own-image.ts';
import type { Json } from '#lib/database.types.ts';
import { supabase } from '#lib/supabase.ts';
import { valuesOf } from './artwork-values.ts';
import { signedYear } from './format.ts';
import { artworkErrorMessage } from './errors.ts';
import type {
	ArtworkFieldErrors,
	ArtworkImageInput,
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
	source_wikidata_id: string | null;
	source_image_file: string | null;
	source_image_licence: string | null;
	source_image_licence_url: string | null;
	source_image_attribution: string | null;
	own_image_path: string | null;
	own_image_url: string | null;
	image_width: number | null;
	image_height: number | null;
	artwork_values: ArtworkValueRow[];
};

type StoredImage = Exclude<ArtworkImageInput, { kind: 'file' }>;

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
	'source_wikidata_id',
	'source_image_file',
	'source_image_licence',
	'source_image_licence_url',
	'source_image_attribution',
	'own_image_path',
	'own_image_url',
	'image_width',
	'image_height',
	'artwork_values(position, category_values(category_code, name))'
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
		image: null
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
		if (input.yearFrom !== null) errors.yearTo = m.artworkErrors.periodEndRequired;
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
		errors.yearTo = m.artworkErrors.periodOrder;
	}
	return errors;
}

function storedYearFrom(input: ArtworkInput): number | null {
	const from = signedYear(input.yearFrom, input.fromBeforeCommonEra);
	return from === signedYear(input.yearTo, input.toBeforeCommonEra) ? null : from;
}

function imageColumns(image: StoredImage | null): Record<string, string | number | null> {
	return {
		source_wikidata_id: image?.kind === 'commons' ? image.wikidataId : null,
		source_image_file: image?.kind === 'commons' ? image.file : null,
		source_image_licence: image?.kind === 'commons' ? image.licence : null,
		source_image_licence_url: image?.kind === 'commons' ? image.licenceUrl : null,
		source_image_attribution: image?.kind === 'commons' ? image.attribution : null,
		own_image_path: image?.kind === 'upload' ? image.path : null,
		own_image_url: image?.kind === 'url' ? image.url : null,
		image_width: image?.width ?? null,
		image_height: image?.height ?? null
	};
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

async function storedImage(
	image: ArtworkImageInput | null
): Promise<{ image: StoredImage | null; error?: undefined } | { error: string }> {
	if (image?.kind !== 'file') return { image };
	const upload = await uploadOwnImage(image.file);
	if (upload.error !== undefined) return { error: upload.error };
	return {
		image: { kind: 'upload', path: upload.path, width: image.width, height: image.height }
	};
}

function uploadPath(image: ArtworkImageInput | null): string | null {
	return image?.kind === 'upload' ? image.path : null;
}

export async function saveArtwork(
	input: ArtworkInput,
	existing?: ExistingArtwork
): Promise<SaveArtworkResult> {
	const fieldErrors = validateArtwork(input);
	if (Object.keys(fieldErrors).length > 0) return { saved: false, fieldErrors };

	const stored = await storedImage(input.image);
	if (stored.error !== undefined) return { saved: false, error: stored.error, fieldErrors };
	const newUpload = input.image?.kind === 'file' ? uploadPath(stored.image) : null;

	const { data, error } = await supabase
		.rpc('save_artwork', {
			artwork: artworkColumns({ ...input, image: stored.image }),
			values_by_category: valuesByCategory(input),
			existing_id: existing?.id
		})
		.single();
	if (error) {
		if (newUpload && error.code) await removeOwnImage(newUpload);
		return { saved: false, error: artworkErrorMessage(error), fieldErrors };
	}

	const previousUpload = uploadPath(existing?.image ?? null);
	if (previousUpload && previousUpload !== uploadPath(stored.image)) {
		await removeOwnImage(previousUpload);
	}

	return { saved: true, id: data.id, number: data.record_number };
}

function imageOf(row: ArtworkRecordRow): ArtworkImageInput | null {
	const size = { width: row.image_width, height: row.image_height };
	if (row.own_image_path) return { kind: 'upload', path: row.own_image_path, ...size };
	if (row.own_image_url) return { kind: 'url', url: row.own_image_url, ...size };
	if (row.source_wikidata_id && row.source_image_file) {
		return {
			kind: 'commons',
			wikidataId: row.source_wikidata_id,
			file: row.source_image_file,
			licence: row.source_image_licence,
			licenceUrl: row.source_image_licence_url,
			attribution: row.source_image_attribution,
			...size
		};
	}
	return null;
}

function artworkRecordFromRow(row: ArtworkRecordRow): ArtworkRecord {
	return {
		id: row.id,
		number: row.record_number,
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
		image: imageOf(row)
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
	if (artwork.image?.kind === 'upload') {
		artwork.image.previewUrl = await ownImageUrl(artwork.image.path);
	}
	return { artwork };
}
