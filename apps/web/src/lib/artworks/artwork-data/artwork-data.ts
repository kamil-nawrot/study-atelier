import { m } from '#lib/i18n/i18n.ts';
import { removeOwnImage } from '#lib/images/own-image-data/own-image-data.ts';
import type { Json } from '#lib/shared/data/database.types.ts';
import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { ownEntriesOf, valuesOf } from '#lib/card-index/artwork-values/artwork-values.ts';
import { signedYear } from '#lib/catalogue/years/years.ts';
import { artworkErrorMessage } from '#lib/catalogue/errors/errors.ts';
import {
	IMAGE_COLUMNS,
	imageOf,
	imageRecord,
	storedImage,
	uploadPath,
	withPreview
} from '#lib/images/image-record/image-record.ts';
import type { ImageRow } from '#lib/images/types/image-row.ts';
import type { StoredImage } from '#lib/images/types/stored-image.ts';
import type { ArtworkFieldErrors } from '#lib/artworks/types/artwork-field-errors.ts';
import type { ArtworkInput } from '#lib/artworks/types/artwork-input.ts';
import type { ArtworkValueRow } from '#lib/card-index/types/artwork-value-row.ts';
import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
import type { FieldEntryRow } from '#lib/card-index/types/field-entry-row.ts';
import type { LoadArtworkResult } from '#lib/artworks/types/load-artwork-result.ts';
import type { ArtworkTypeCode } from '#lib/catalogue/types/artwork-type-code.ts';
import type { CategoryCode } from '#lib/catalogue/types/category-code.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import { names, validateArtwork, oneLine } from '#lib/artworks/artwork-record/artwork-record.ts';

type ExistingArtwork = {
	id: string;
	image: ArtworkImageInput | null;
	images: ArtworkImageInput[];
};

type SaveArtworkResult =
	| { saved: true; id: string; number: number }
	| { saved: false; error?: string; fieldErrors: ArtworkFieldErrors };

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
	artwork_images: (ImageRow & { id: string; position: number })[];
	artwork_field_entries?: FieldEntryRow[];
};

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
	'artwork_values(position, category_values(category_code, name))',
	`artwork_images(id, position, ${IMAGE_COLUMNS.join(', ')})`,
	'artwork_field_entries(field_id, text_value)'
].join(', ');

function storedYearFrom(input: ArtworkInput): number | null {
	const from = signedYear(input.yearFrom, input.fromBeforeCommonEra);
	return from === signedYear(input.yearTo, input.toBeforeCommonEra) ? null : from;
}

function artworkColumns(input: ArtworkInput): Record<string, Json> {
	return {
		title: input.title.trim(),
		author_unknown: input.authorUnknown,
		year_from: storedYearFrom(input),
		year_to: signedYear(input.yearTo, input.toBeforeCommonEra),
		year_approximate: input.yearTo !== null && input.yearApproximate,
		type_code: input.typeCode,
		era_code: input.eraCode,
		notes: input.notes.trim() || null
	};
}

function valuesByCategory(input: ArtworkInput): Record<string, string[]> {
	const own = Object.entries(input.own ?? {}).flatMap(([id, entry]) =>
		Array.isArray(entry) ? [[id, names(entry)]] : []
	);
	return {
		author: input.authorUnknown ? [] : names(input.authors),
		period: names(input.period === null ? [] : [input.period]),
		style: names(input.styles),
		material: names(input.materials),
		location: names(input.location === null ? [] : [input.location]),
		...Object.fromEntries(own)
	} satisfies Record<CategoryCode, string[]>;
}

function fieldEntries(input: ArtworkInput): Record<string, Json> | undefined {
	if (!input.own) return undefined;
	return Object.fromEntries(
		Object.entries(input.own).flatMap(([id, entry]): [string, Json][] => {
			if (Array.isArray(entry)) return [];
			if (typeof entry === 'boolean') return [[id, entry]];
			return [[id, oneLine(entry)]];
		})
	);
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
	const { data, error, status } = await supabase
		.rpc('save_artwork', {
			artwork: artworkColumns(input),
			values_by_category: valuesByCategory(input),
			existing_id: existing?.id,
			images: stored.map(imageRecord) as unknown as Json,
			field_entries: fieldEntries(input)
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
	const [image = null, ...images] = [...(row.artwork_images ?? [])]
		.sort((first, second) => first.position - second.position)
		.flatMap((stored) => imageOf(stored) ?? []);
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
		image,
		images,
		own: ownEntriesOf(row.artwork_values, row.artwork_field_entries)
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
