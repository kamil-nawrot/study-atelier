import { SIGNED_URL_SECONDS, ownThumbnailPath } from '#lib/images/bucket/bucket.ts';
import { ownImageUrls } from '#lib/images/own-image-data/own-image-data.ts';
import { fetchCommonsThumbnails } from '#lib/images/commons/commons.ts';
import { backfillThumbnails } from '#lib/images/thumbnail-backfill/thumbnail-backfill.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import { cacheKeys, cached } from '#lib/shared/data/data-cache/data-cache.ts';
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
	want_to_see?: boolean;
	deleted_at: string | null;
	artwork_values: ArtworkValueRow[];
	artwork_field_entries?: FieldEntryRow[];
	visit_artworks?: { visit_id: string }[];
};

export const ARTWORK_COLUMNS = [
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
	'want_to_see',
	'deleted_at',
	'artwork_values(position, category_values(category_code, name, author_details(sort_name)))',
	'artwork_field_entries(field_id, text_value)',
	'visit_artworks(visit_id)'
].join(', ');

async function wallImageUrls(paths: string[]): Promise<Map<string, string>> {
	const thumbnails = await ownImageUrls(paths.map(ownThumbnailPath));
	const urls = new Map<string, string>();
	const withoutThumbnail: string[] = [];
	for (const path of paths) {
		const thumbnail = thumbnails.get(ownThumbnailPath(path));
		if (thumbnail) urls.set(path, thumbnail);
		else withoutThumbnail.push(path);
	}
	const originals = await ownImageUrls(withoutThumbnail);
	for (const [path, url] of originals) urls.set(path, url);
	backfillThumbnails(originals);
	return urls;
}

export async function fetchAllRows(
	page: Parameters<typeof fetchAll>[0]
): Promise<{ rows: ArtworkRow[]; error?: string }> {
	const { rows, error } = await fetchAll<ArtworkRow>(page);
	return error ? { rows: [], error: collectionErrorMessage(error) } : { rows };
}

export function wallArtwork(row: ArtworkRow): WallArtwork {
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
		...(row.want_to_see ? { wantToSee: true } : {}),
		own: ownEntriesOf(row.artwork_values, row.artwork_field_entries),
		image,
		...(pendingImage ? { pendingImage } : {}),
		...(main?.own_image_path ? { ownImagePath: main.own_image_path } : {})
	};
}

export function rememberedArtwork(artwork: WallArtwork): WallArtwork | undefined {
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
	const atelier = await cached(cacheKeys.atelier, fetchAtelier);
	if (atelier.error) return atelier;
	return {
		artworks: atelier.artworks.map((artwork) => rememberedArtwork(artwork) ?? artwork)
	};
}

type WallFilter =
	| { eraCode: string }
	| { valueId: string }
	| { termId: string }
	| { symbolId: string }
	| { visitId: string };

const FILTER_EMBEDS: Record<string, string> = {
	valueId: 'valued:artwork_values!inner(value_id)',
	termId: 'pinned:artwork_images!inner(artwork_pins!inner(glossary_entry_id))',
	symbolId: 'symbolised:artwork_images!inner(artwork_pins!inner(symbol_id))',
	visitId: 'seen:visit_artworks!inner(visit_id)'
};

const FILTER_COLUMNS: Record<string, string> = {
	eraCode: 'era_code',
	valueId: 'valued.value_id',
	termId: 'pinned.artwork_pins.glossary_entry_id',
	symbolId: 'symbolised.artwork_pins.symbol_id',
	visitId: 'seen.visit_id'
};

function fetchWallRows(filter?: WallFilter): Promise<{ rows: ArtworkRow[]; error?: string }> {
	const [name, value] = filter ? Object.entries(filter)[0] : [];
	const embed = name ? FILTER_EMBEDS[name] : undefined;
	return fetchAllRows((from, to) => {
		const query = supabase
			.from('artworks')
			.select(embed ? `${ARTWORK_COLUMNS}, ${embed}` : ARTWORK_COLUMNS);
		const filtered = name ? query.eq(FILTER_COLUMNS[name], value as string) : query;
		return filtered
			.eq('artwork_images.position', 0)
			.is('deleted_at', null)
			.order('created_at', { ascending: false })
			.order('id', { ascending: false })
			.limit(1, { referencedTable: 'visit_artworks' })
			.range(from, to);
	});
}

async function loadWall(filter: WallFilter): Promise<AtelierResult> {
	const { rows, error } = await fetchWallRows(filter);
	if (error) return { artworks: [], error };
	return {
		artworks: rows.map(wallArtwork).map((artwork) => rememberedArtwork(artwork) ?? artwork)
	};
}

export function loadArtworksOfValue(
	value: { eraCode: string } | { valueId: string }
): Promise<AtelierResult> {
	return loadWall(value);
}

export function loadArtworksOfTerm(termId: string): Promise<AtelierResult> {
	return loadWall({ termId });
}

export function loadArtworksOfSymbol(symbolId: string): Promise<AtelierResult> {
	return loadWall({ symbolId });
}

export function loadArtworksOfVisit(visitId: string): Promise<AtelierResult> {
	return loadWall({ visitId });
}

async function fetchAtelier(): Promise<AtelierResult> {
	const { rows, error } = await fetchWallRows();
	if (error) return { artworks: [], error };

	return { artworks: rows.map(wallArtwork) };
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
			.limit(1, { referencedTable: 'visit_artworks' })
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
