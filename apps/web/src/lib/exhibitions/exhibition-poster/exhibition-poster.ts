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

export const CENTRED_CROP: PosterCrop = { x: 0.5, y: 0.5, zoom: 1 };

export const POSTER_ZOOM = { min: 1, max: 3 } as const;

export const FILTER_RANGES: Record<keyof PosterFilters, { min: number; max: number }> = {
	grayscale: { min: 0, max: 100 },
	sepia: { min: 0, max: 100 },
	brightness: { min: 70, max: 130 },
	contrast: { min: 70, max: 130 },
	saturate: { min: 0, max: 150 }
};

const FILTER_ORDER = ['grayscale', 'sepia', 'brightness', 'contrast', 'saturate'] as const;

export function posterFilter(filters: PosterFilters): string | undefined {
	const parts = FILTER_ORDER.filter((name) => filters[name] !== NEUTRAL_FILTERS[name]).map(
		(name) => `${name}(${filters[name]}%)`
	);
	return parts.length > 0 ? parts.join(' ') : undefined;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

export function movedCrop(crop: PosterCrop, dx: number, dy: number): PosterCrop {
	return { ...crop, x: clamp(crop.x + dx, 0, 1), y: clamp(crop.y + dy, 0, 1) };
}

export function zoomedCrop(crop: PosterCrop, zoom: number): PosterCrop {
	return { ...crop, zoom: clamp(zoom, POSTER_ZOOM.min, POSTER_ZOOM.max) };
}

export type Size = { width: number; height: number };

function cropSpan(zoom: number, rendered: number, frame: number): number {
	return zoom * rendered - frame;
}

export function draggedCrop(
	crop: PosterCrop,
	dx: number,
	dy: number,
	frame: Size,
	natural: Size
): PosterCrop {
	const scale = Math.max(frame.width / natural.width, frame.height / natural.height);
	const spanX = cropSpan(crop.zoom, natural.width * scale, frame.width);
	const spanY = cropSpan(crop.zoom, natural.height * scale, frame.height);
	return movedCrop(crop, spanX > 0 ? -dx / spanX : 0, spanY > 0 ? -dy / spanY : 0);
}

export function draftPoster(
	stored: ExhibitionPoster,
	artworkIds: readonly string[]
): ExhibitionPoster {
	return posterChoiceMissing(stored, artworkIds)
		? { ...NO_POSTER, filters: stored.filters }
		: stored;
}

export function posterToSave(
	draft: ExhibitionPoster,
	stored: ExhibitionPoster,
	artworkIds: readonly string[],
	choiceChanged: boolean
): ExhibitionPoster {
	return !choiceChanged && posterChoiceMissing(stored, artworkIds)
		? { ...stored, filters: draft.filters }
		: draft;
}
