import type { ArtworkTileImage } from '@study-atelier/ui';
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

export type WallArtwork = {
	id: string;
	number: number;
	title: string;
	authors: string[];
	date?: string;
	image?: ArtworkTileImage;
};

export type AtelierResult = {
	artworks: WallArtwork[];
	error?: string;
};

export type ImageSize = {
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
	source_image_file: string | null;
	own_image_path: string | null;
	own_image_url: string | null;
	image_width: number | null;
	image_height: number | null;
	artwork_values: { position: number; category_values: CategoryValueRow | null }[];
};

export const IMAGES_BUCKET = 'artwork-images';
export const SIGNED_URL_SECONDS = 60 * 60;
export const DEFAULT_IMAGE_SIZE: ImageSize = { width: 4, height: 5 };

const TILE_SIZES = '(min-width: 768px) 33vw, 100vw';
const TILE_WIDTH = 500;

const ARTWORK_COLUMNS = [
	'id',
	'record_number',
	'title',
	'year',
	'year_approximate',
	'source_image_file',
	'own_image_path',
	'own_image_url',
	'image_width',
	'image_height',
	'artwork_values(position, category_values(category_code, name))'
].join(', ');

function authorsOf(row: ArtworkRow): string[] {
	return row.artwork_values
		.filter((value) => value.category_values?.category_code === 'author')
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
			.filter((entry) => entry.path && entry.signedUrl)
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

export async function loadAtelier(): Promise<AtelierResult> {
	const { data, error } = await supabase
		.from('artworks')
		.select(ARTWORK_COLUMNS)
		.is('deleted_at', null)
		.order('created_at', { ascending: false });
	if (error) return { artworks: [], error: collectionErrorMessage(error) };

	const rows = (data ?? []) as unknown as ArtworkRow[];
	const [commonsThumbnails, storageUrls] = await Promise.all([
		fetchCommonsThumbnails(
			rows.flatMap((row) => row.source_image_file ?? []),
			TILE_WIDTH
		),
		signedUrls(rows.flatMap((row) => row.own_image_path ?? []))
	]);

	const artworks = rows.map((row): WallArtwork => {
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
			authors: authorsOf(row),
			date: formatYear(row.year, row.year_approximate),
			image
		};
	});
	return { artworks };
}
