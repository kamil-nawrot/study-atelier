import type { ArtworkTileImage } from '@study-atelier/ui';
import { IMAGES_BUCKET, SIGNED_URL_SECONDS } from '#lib/images/bucket.ts';
import {
	COMMONS_THUMBNAIL_WIDTHS,
	commonsFileUrl,
	commonsSrcset,
	commonsThumbnailSrcset,
	fetchCommonsThumbnails
} from '#lib/images/commons.ts';
import { supabase } from '#lib/supabase.ts';
import { collectionErrorMessage } from './errors.ts';
import { formatYear } from './format.ts';
import { tileSizes } from './masonry.ts';
import type {
	AtelierResult,
	CategoryCode,
	EraCode,
	TrashArtwork,
	TrashResult,
	WallArtwork
} from './types.ts';

type ImageSize = {
	width: number;
	height: number;
};

type CategoryValueRow = {
	category_code: string;
	name: string;
};

type ArtworkRow = {
	id: string;
	record_number: number;
	title: string;
	year: number | null;
	year_approximate: boolean;
	era_code: EraCode | null;
	source_image_file: string | null;
	own_image_path: string | null;
	own_image_url: string | null;
	image_width: number | null;
	image_height: number | null;
	deleted_at: string | null;
	artwork_values: { position: number; category_values: CategoryValueRow | null }[];
};

export const DEFAULT_IMAGE_SIZE: ImageSize = { width: 4, height: 5 };

const PAGE_SIZE = 1000;
const TILE_SIZES = tileSizes();
const TILE_WIDTH = 500;

const ARTWORK_COLUMNS = [
	'id',
	'record_number',
	'title',
	'year',
	'year_approximate',
	'era_code',
	'source_image_file',
	'own_image_path',
	'own_image_url',
	'image_width',
	'image_height',
	'deleted_at',
	'artwork_values(position, category_values(category_code, name))'
].join(', ');

function valuesOf(row: ArtworkRow, category: CategoryCode): string[] {
	return row.artwork_values
		.filter((value) => value.category_values?.category_code === category)
		.sort((a, b) => a.position - b.position)
		.map((value) => (value.category_values as CategoryValueRow).name);
}

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

function storedSize(row: ArtworkRow): ImageSize | undefined {
	return row.image_width && row.image_height
		? { width: row.image_width, height: row.image_height }
		: undefined;
}

function thumbnailWidths(size: ImageSize | undefined): number[] {
	const largest = size?.width ?? TILE_WIDTH;
	return COMMONS_THUMBNAIL_WIDTHS.filter((width) => width <= largest);
}

function commonsImage(
	file: string,
	thumbnailUrl: string | undefined,
	size: ImageSize | undefined
): ArtworkTileImage {
	const widths = thumbnailWidths(size);
	const srcset = thumbnailUrl
		? commonsThumbnailSrcset(thumbnailUrl, TILE_WIDTH, widths)
		: commonsSrcset(file, widths);
	return {
		src: thumbnailUrl ?? commonsFileUrl(file, TILE_WIDTH),
		srcset: srcset || undefined,
		sizes: TILE_SIZES,
		...(size ?? DEFAULT_IMAGE_SIZE)
	};
}

function ownImage(
	src: string | undefined,
	size: ImageSize | undefined
): ArtworkTileImage | undefined {
	return src ? { src, ...(size ?? DEFAULT_IMAGE_SIZE) } : undefined;
}

type RowsPage = {
	data: unknown;
	error: { code?: string; message?: string } | null;
};

async function fetchAllRows(
	page: (from: number, to: number) => PromiseLike<RowsPage>
): Promise<{ rows: ArtworkRow[]; error?: string }> {
	const rows: ArtworkRow[] = [];
	for (let from = 0; ; from += PAGE_SIZE) {
		const { data, error } = await page(from, from + PAGE_SIZE - 1);
		if (error) return { rows: [], error: collectionErrorMessage(error) };
		const received = (data ?? []) as ArtworkRow[];
		rows.push(...received);
		if (received.length < PAGE_SIZE) return { rows };
	}
}

async function wallArtworks(rows: ArtworkRow[]): Promise<WallArtwork[]> {
	const [commonsThumbnails, storageUrls] = await Promise.all([
		fetchCommonsThumbnails(
			rows.flatMap((row) => row.source_image_file ?? []),
			TILE_WIDTH
		),
		signedUrls(rows.flatMap((row) => row.own_image_path ?? []))
	]);

	const signedAt = Date.now();
	return rows.map((row): WallArtwork => {
		const ownSource = row.own_image_path
			? storageUrls.get(row.own_image_path)
			: (row.own_image_url ?? undefined);
		const size = storedSize(row);
		const image =
			row.own_image_path || row.own_image_url
				? ownImage(ownSource, size)
				: row.source_image_file
					? commonsImage(row.source_image_file, commonsThumbnails.get(row.source_image_file), size)
					: undefined;
		return {
			id: row.id,
			number: row.record_number,
			title: row.title,
			authors: valuesOf(row, 'author'),
			date: formatYear(row.year, row.year_approximate),
			year: row.year,
			eraCode: row.era_code,
			image,
			...(row.own_image_path
				? {
						ownImagePath: row.own_image_path,
						imageSignedAt: signedAt,
						...(image ? {} : { imageUnavailable: true })
					}
				: {})
		};
	});
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

	const urls = await signedUrls(expired.flatMap((artwork) => artwork.ownImagePath ?? []));
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
			.is('deleted_at', null)
			.order('created_at', { ascending: false })
			.order('id', { ascending: false })
			.range(from, to)
	);
	if (error) return { artworks: [], error };

	return { artworks: await wallArtworks(rows) };
}

export async function loadTrash(): Promise<TrashResult> {
	const { rows, error } = await fetchAllRows((from, to) =>
		supabase
			.from('artworks')
			.select(ARTWORK_COLUMNS)
			.not('deleted_at', 'is', null)
			.order('deleted_at', { ascending: false })
			.order('id', { ascending: false })
			.range(from, to)
	);
	if (error) return { artworks: [], error };

	const artworks = await wallArtworks(rows);
	return {
		artworks: artworks.map((artwork, index): TrashArtwork => ({
			...artwork,
			deletedAt: rows[index].deleted_at as string,
			ownImagePath: rows[index].own_image_path
		}))
	};
}
