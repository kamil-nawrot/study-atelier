import type { ExhibitionPoster } from '#lib/exhibitions/types/exhibition-poster.ts';
import type { PosterCrop } from '#lib/exhibitions/types/poster-crop.ts';
import type { PosterFilters } from '#lib/exhibitions/types/poster-filters.ts';

export type PosterColumns = {
	cover_artwork_id: string | null;
	cover_image_id: string | null;
	cover_x: number | null;
	cover_y: number | null;
	cover_zoom: number | null;
	cover_grayscale: number;
	cover_sepia: number;
	cover_brightness: number;
	cover_contrast: number;
	cover_saturate: number;
};

export const POSTER_COLUMNS =
	'cover_artwork_id, cover_image_id, cover_x, cover_y, cover_zoom, cover_grayscale, cover_sepia, cover_brightness, cover_contrast, cover_saturate';

export const NEUTRAL_FILTERS: PosterFilters = {
	grayscale: 0,
	sepia: 0,
	brightness: 100,
	contrast: 100,
	saturate: 100
};

export const NO_POSTER: ExhibitionPoster = {
	artworkId: null,
	imageId: null,
	crop: null,
	filters: NEUTRAL_FILTERS
};

function cropOf(columns: PosterColumns): PosterCrop | null {
	const { cover_x: x, cover_y: y, cover_zoom: zoom } = columns;
	return x === null || y === null || zoom === null ? null : { x, y, zoom };
}

export function storedPoster(columns: PosterColumns): ExhibitionPoster {
	return {
		artworkId: columns.cover_artwork_id,
		imageId: columns.cover_artwork_id ? columns.cover_image_id : null,
		crop: columns.cover_artwork_id ? cropOf(columns) : null,
		filters: {
			grayscale: columns.cover_grayscale,
			sepia: columns.cover_sepia,
			brightness: columns.cover_brightness,
			contrast: columns.cover_contrast,
			saturate: columns.cover_saturate
		}
	};
}

export function shownPoster(
	stored: ExhibitionPoster,
	artworkIds: readonly string[]
): ExhibitionPoster {
	if (stored.artworkId && artworkIds.includes(stored.artworkId)) return stored;
	return { artworkId: artworkIds[0] ?? null, imageId: null, crop: null, filters: stored.filters };
}

export function posterChoiceMissing(
	stored: ExhibitionPoster,
	artworkIds: readonly string[]
): boolean {
	return stored.artworkId !== null && !artworkIds.includes(stored.artworkId);
}
