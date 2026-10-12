import { m } from '#lib/i18n/index.ts';
import { removeOwnImage, uploadOwnImage } from '#lib/images/own-image.ts';
import { supabase } from '#lib/supabase.ts';
import { artworkErrorMessage } from './errors.ts';
import type {
	ArtworkFieldErrors,
	ArtworkImageInput,
	ArtworkInput,
	ArtworkRecord,
	ArtworkTypeCode,
	CategoryCode,
	ExistingArtwork,
	LoadArtworkResult,
	SaveArtworkResult
} from './types.ts';

type CategoryValueRow = {
	category_code: string;
	name: string;
};

type ArtworkRecordRow = {
	id: string;
	record_number: number;
	title: string;
	author_unknown: boolean;
	year: number | null;
	year_approximate: boolean;
	type_code: ArtworkTypeCode | null;
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
	artwork_values: { position: number; category_values: CategoryValueRow | null }[];
};

type StoredImage = Exclude<ArtworkImageInput, { kind: 'file' }>;

type StoredInput = Omit<ArtworkInput, 'image'> & { image: StoredImage | null };

type SavedRow = {
	id: string;
	record_number: number;
};

const RECORD_COLUMNS = [
	'id',
	'record_number',
	'title',
	'author_unknown',
	'year',
	'year_approximate',
	'type_code',
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
		year: null,
		beforeCommonEra: false,
		yearApproximate: false,
		typeCode: null,
		periods: [],
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

export function validateArtwork(input: ArtworkInput): ArtworkFieldErrors {
	const errors: ArtworkFieldErrors = {};
	if (!input.title.trim()) errors.title = m.artworkErrors.titleRequired;
	if (!input.authorUnknown && names(input.authors).length === 0) {
		errors.authors = m.artworkErrors.authorRequired;
	}
	if (input.year === null) {
		if (input.beforeCommonEra || input.yearApproximate) errors.year = m.artworkErrors.yearRequired;
	} else if (!Number.isInteger(input.year) || input.year < 1) {
		errors.year = m.artworkErrors.yearInvalid;
	}
	return errors;
}

function storedYear(input: ArtworkInput): number | null {
	if (input.year === null) return null;
	return input.beforeCommonEra ? -input.year : input.year;
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

function artworkColumns(input: StoredInput): Record<string, unknown> {
	return {
		title: input.title.trim(),
		author_unknown: input.authorUnknown,
		year: storedYear(input),
		year_approximate: input.year !== null && input.yearApproximate,
		type_code: input.typeCode,
		notes: input.notes.trim() || null,
		...imageColumns(input.image)
	};
}

function valuesByCategory(input: ArtworkInput): Record<CategoryCode, string[]> {
	return {
		author: input.authorUnknown ? [] : names(input.authors),
		period: names(input.periods),
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
			existing_id: existing?.id ?? null
		})
		.single();
	if (error) {
		if (newUpload) await removeOwnImage(newUpload);
		return { saved: false, error: artworkErrorMessage(error), fieldErrors };
	}

	const previousUpload = uploadPath(existing?.image ?? null);
	if (previousUpload && previousUpload !== uploadPath(stored.image)) {
		await removeOwnImage(previousUpload);
	}

	const row = data as SavedRow;
	return { saved: true, id: row.id, number: row.record_number };
}

function valuesOf(row: ArtworkRecordRow, category: CategoryCode): string[] {
	return row.artwork_values
		.filter((value) => value.category_values?.category_code === category)
		.sort((a, b) => a.position - b.position)
		.map((value) => (value.category_values as CategoryValueRow).name);
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
		authors: valuesOf(row, 'author'),
		authorUnknown: row.author_unknown,
		year: row.year === null ? null : Math.abs(row.year),
		beforeCommonEra: row.year !== null && row.year < 0,
		yearApproximate: row.year_approximate,
		typeCode: row.type_code,
		periods: valuesOf(row, 'period'),
		styles: valuesOf(row, 'style'),
		materials: valuesOf(row, 'material'),
		location: valuesOf(row, 'location')[0] ?? null,
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
	if (!data) return { error: m.artworkErrors.notFound };
	return { artwork: artworkRecordFromRow(data as unknown as ArtworkRecordRow) };
}
