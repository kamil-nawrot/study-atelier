import { IMAGES_BUCKET, SIGNED_URL_SECONDS, ownThumbnailPath } from '#lib/images/bucket/bucket.ts';
import { fetchCommonsThumbnails } from '#lib/images/commons/commons.ts';
import { backfillThumbnails } from '#lib/images/thumbnail-backfill/thumbnail-backfill.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import {
	authorSortNamesOf,
	ownEntriesOf,
	valuesOf
} from '#lib/card-index/artwork-values/artwork-values.ts';
import { collectionErrorMessage } from '#lib/catalogue/errors/errors.ts';
import { formatDate } from '#lib/catalogue/years/years.ts';
import { resolvedImages } from '#lib/images/resolved-images/resolved-images.ts';
import type { ArtworkValueRow } from '#lib/card-index/types/artwork-value-row.ts';
import type { FieldEntryRow } from '#lib/card-index/types/field-entry-row.ts';
import type { TrashArtwork } from '#lib/wall/types/trash-artwork.ts';
import type { ArtworkTypeCode } from '#lib/catalogue/types/artwork-type-code.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { PendingImage } from '#lib/catalogue/types/pending-image.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
import type { MainImageRow } from '#lib/wall/types/main-image-row.ts';
import {
	DEFAULT_IMAGE_SIZE,
	TILE_WIDTH,
	commonsImage,
	linkedImage,
	ownImage,
	pendingImageOf,
	storedSize
} from '#lib/wall/tile-image/tile-image.ts';

type AtelierResult = {
	artworks: WallArtwork[];
	ownFields?: OwnFieldDefinition[];
	error?: string;
};

type TrashResult = {
	artworks: TrashArtwork[];
	error?: string;
};

type ArtworkRow = {
	id: string;
	record_number: number;
	title: string;
	year_from: number | null;
	year_to: number | null;
	year_approximate: boolean;
	era_code: EraCode | null;
	type_code: ArtworkTypeCode | null;
	artwork_images: MainImageRow[];
	favourite: boolean;
	deleted_at: string | null;
	artwork_values: ArtworkValueRow[];
	artwork_field_entries?: FieldEntryRow[];
	visit_artworks?: { visit_id: string }[];
};

const ARTWORK_COLUMNS = [
	'id',
	'record_number',
	'title',
	'year_from',
	'year_to',
	'year_approximate',
	'era_code',
	'type_code',
	'artwork_images(source_image_file, own_image_path, own_image_url, image_width, image_height)',
	'favourite',
	'deleted_at',
	'artwork_values(position, category_values(category_code, name, author_details(sort_name)))',
	'artwork_field_entries(field_id, text_value)',
	'visit_artworks(visit_id)'
].join(', ');

async function signedUrls(paths: string[]): Promise<Map<string, string>> {
	if (paths.length === 0) return new Map();
	const { data, error } = await supabase.storage
		.from(IMAGES_BUCKET)
		.createSignedUrls(paths, SIGNED_URL_SECONDS);
	if (error || !data) return new Map();
	return new Map(
		data
			.filter((entry) => entry.path && entry.signedUrl && !entry.error)
			.map((entry) => [entry.path as string, entry.signedUrl as string])
	);
}

async function wallImageUrls(paths: string[]): Promise<Map<string, string>> {
	const thumbnails = await signedUrls(paths.map(ownThumbnailPath));
	const urls = new Map<string, string>();
	const withoutThumbnail: string[] = [];
	for (const path of paths) {
		const thumbnail = thumbnails.get(ownThumbnailPath(path));
		if (thumbnail) urls.set(path, thumbnail);
		else withoutThumbnail.push(path);
	}
	const originals = await signedUrls(withoutThumbnail);
	for (const [path, url] of originals) urls.set(path, url);
	backfillThumbnails(originals);
	return urls;
}

async function fetchAllRows(
	page: Parameters<typeof fetchAll>[0]
): Promise<{ rows: ArtworkRow[]; error?: string }> {
	const { rows, error } = await fetchAll<ArtworkRow>(page);
	return error ? { rows: [], error: collectionErrorMessage(error) } : { rows };
}

function wallArtwork(row: ArtworkRow): WallArtwork {
	const main = row.artwork_images[0];
	const size = storedSize(main);
	const pendingImage = pendingImageOf(main, size);
	const image = pendingImage
		? { ...(size ?? DEFAULT_IMAGE_SIZE) }
		: linkedImage(main?.own_image_url ?? undefined, size);
	return {
		id: row.id,
		number: row.record_number,
		title: row.title,
		authors: valuesOf(row.artwork_values, 'author'),
		authorSortNames: authorSortNamesOf(row.artwork_values),
		date: formatDate(row.year_from, row.year_to, row.year_approximate),
		yearFrom: row.year_from,
		yearTo: row.year_to,
		eraCode: row.era_code,
		typeCode: row.type_code,
		period: valuesOf(row.artwork_values, 'period')[0] ?? null,
		styles: valuesOf(row.artwork_values, 'style'),
		materials: valuesOf(row.artwork_values, 'material'),
		location: valuesOf(row.artwork_values, 'location')[0] ?? null,
		hasImage: main !== undefined,
		favourite: row.favourite,
		...(row.visit_artworks?.length ? { seen: true } : {}),
		own: ownEntriesOf(row.artwork_values, row.artwork_field_entries),
		image,
		...(pendingImage ? { pendingImage } : {}),
		...(main?.own_image_path ? { ownImagePath: main.own_image_path } : {})
	};
}

function rememberedArtwork(artwork: WallArtwork): WallArtwork | undefined {
	const { pendingImage, ...resolved } = artwork;
	if (!pendingImage) return undefined;
	const { sourceFile, ownPath, size } = pendingImage;
	if (sourceFile) {
		const thumbnail = resolvedImages.thumbnail(sourceFile);
		return thumbnail
			? { ...resolved, image: commonsImage(sourceFile, thumbnail, size) }
			: undefined;
	}
	const signed = ownPath ? resolvedImages.signedUrl(ownPath) : undefined;
	return signed
		? { ...resolved, image: ownImage(signed.url, size), imageSignedAt: signed.signedAt }
		: undefined;
}

function unresolvedArtwork(artwork: WallArtwork, signedAt: number): WallArtwork {
	const { pendingImage, ...resolved } = artwork;
	const { sourceFile, size } = pendingImage as PendingImage;
	if (sourceFile) return { ...resolved, image: commonsImage(sourceFile, undefined, size) };
	return { ...resolved, image: undefined, imageSignedAt: signedAt, imageUnavailable: true };
}

export async function resolveImages(artworks: WallArtwork[]): Promise<WallArtwork[]> {
	const pending = artworks.filter((artwork) => artwork.pendingImage);
	if (pending.length === 0) return [];

	const missing = pending.filter((artwork) => !rememberedArtwork(artwork));
	const files = missing.flatMap((artwork) => artwork.pendingImage?.sourceFile ?? []);
	const paths = missing.flatMap((artwork) => artwork.pendingImage?.ownPath ?? []);
	const [thumbnails, urls] = await Promise.all([
		files.length > 0
			? fetchCommonsThumbnails(files, TILE_WIDTH)
			: Promise.resolve(new Map<string, string>()),
		wallImageUrls(paths)
	]);

	const signedAt = Date.now();
	resolvedImages.rememberThumbnails(thumbnails);
	resolvedImages.rememberSignedUrls(urls, signedAt);
	return pending.map(
		(artwork) => rememberedArtwork(artwork) ?? unresolvedArtwork(artwork, signedAt)
	);
}

export async function refreshExpiredImages(
	artworks: WallArtwork[],
	now: number = Date.now()
): Promise<WallArtwork[]> {
	const expired = artworks.filter(
		(artwork) =>
			artwork.ownImagePath &&
			artwork.imageSignedAt !== undefined &&
			now - artwork.imageSignedAt >= SIGNED_URL_SECONDS * 1000
	);
	if (expired.length === 0) return [];

	const urls = await wallImageUrls(expired.flatMap((artwork) => artwork.ownImagePath ?? []));
	resolvedImages.rememberSignedUrls(urls, now);
	return expired.map((artwork): WallArtwork => {
		const src = urls.get(artwork.ownImagePath as string);
		if (!src) return { ...artwork, image: undefined, imageUnavailable: true, imageSignedAt: now };
		const size = artwork.image ?? DEFAULT_IMAGE_SIZE;
		return {
			...artwork,
			image: { src, width: size.width, height: size.height },
			imageUnavailable: false,
			imageSignedAt: now
		};
	});
}

export async function loadAtelier(): Promise<AtelierResult> {
	const { rows, error } = await fetchAllRows((from, to) =>
		supabase
			.from('artworks')
			.select(ARTWORK_COLUMNS)
			.eq('artwork_images.position', 0)
			.is('deleted_at', null)
			.order('created_at', { ascending: false })
			.order('id', { ascending: false })
			.range(from, to)
	);
	if (error) return { artworks: [], error };

	return {
		artworks: rows.map(wallArtwork).map((artwork) => rememberedArtwork(artwork) ?? artwork)
	};
}

export async function loadTrash(): Promise<TrashResult> {
	const { rows, error } = await fetchAllRows((from, to) =>
		supabase
			.from('artworks')
			.select(ARTWORK_COLUMNS)
			.eq('artwork_images.position', 0)
			.not('deleted_at', 'is', null)
			.order('deleted_at', { ascending: false })
			.order('id', { ascending: false })
			.range(from, to)
	);
	if (error) return { artworks: [], error };

	const artworks = rows.map(wallArtwork);
	const commons = artworks.filter((artwork) => artwork.pendingImage?.sourceFile);
	const resolved = new Map((await resolveImages(commons)).map((artwork) => [artwork.id, artwork]));
	return {
		artworks: artworks.map((artwork, index): TrashArtwork => ({
			...(resolved.get(artwork.id) ?? { ...artwork, image: undefined, pendingImage: undefined }),
			deletedAt: rows[index].deleted_at as string
		}))
	};
}
