import type { ArtworkTileImage } from '@study-atelier/ui';
import {
	COMMONS_THUMBNAIL_WIDTHS,
	commonsFileUrl,
	commonsSrcset,
	fetchCommonsSizes,
	type ImageSize
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
	artwork_values: { position: number; category_values: CategoryValueRow | null }[];
};

export const IMAGES_BUCKET = 'artwork-images';
export const SIGNED_URL_SECONDS = 60 * 60;
export const DEFAULT_IMAGE_SIZE: ImageSize = { width: 4, height: 5 };

const TILE_SIZES = '(min-width: 768px) 25vw, 100vw';
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

function commonsImage(file: string, size: ImageSize | undefined): ArtworkTileImage {
	return {
		src: commonsFileUrl(file, TILE_WIDTH),
		srcset: commonsSrcset(file, COMMONS_THUMBNAIL_WIDTHS),
		sizes: TILE_SIZES,
		...(size ?? DEFAULT_IMAGE_SIZE)
	};
}

function ownImage(src: string | undefined): ArtworkTileImage | undefined {
	return src ? { src, ...DEFAULT_IMAGE_SIZE } : undefined;
}

export async function loadAtelier(): Promise<AtelierResult> {
	const { data, error } = await supabase
		.from('artworks')
		.select(ARTWORK_COLUMNS)
		.is('deleted_at', null)
		.order('created_at', { ascending: false });
	if (error) return { artworks: [], error: collectionErrorMessage(error) };

	const rows = (data ?? []) as unknown as ArtworkRow[];
	const [commonsSizes, storageUrls] = await Promise.all([
		fetchCommonsSizes(rows.flatMap((row) => row.source_image_file ?? [])),
		signedUrls(rows.flatMap((row) => row.own_image_path ?? []))
	]);

	const artworks = rows.map((row): WallArtwork => {
		const ownSource = row.own_image_path
			? storageUrls.get(row.own_image_path)
			: (row.own_image_url ?? undefined);
		const image =
			row.own_image_path || row.own_image_url
				? ownImage(ownSource)
				: row.source_image_file
					? commonsImage(row.source_image_file, commonsSizes.get(row.source_image_file))
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
