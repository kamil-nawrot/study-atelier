import { describe, expect, it } from 'vitest';
import {
	CENTRED_CROP,
	NEUTRAL_FILTERS,
	NO_POSTER,
	draftPoster,
	draggedCrop,
	movedCrop,
	posterChoiceMissing,
	posterFilter,
	posterToSave,
	zoomedCrop,
	shownPoster,
	storedPoster,
	type PosterColumns
} from './exhibition-poster.ts';

const NEUTRAL_COLUMNS: PosterColumns = {
	cover_artwork_id: null,
	cover_image_id: null,
	cover_x: null,
	cover_y: null,
	cover_zoom: null,
	cover_grayscale: 0,
	cover_sepia: 0,
	cover_brightness: 100,
	cover_contrast: 100,
	cover_saturate: 100
};

const CHOSEN_COLUMNS: PosterColumns = {
	cover_artwork_id: 'b',
	cover_image_id: 'b-detail',
	cover_x: 0.25,
	cover_y: 0.75,
	cover_zoom: 2,
	cover_grayscale: 40,
	cover_sepia: 10,
	cover_brightness: 120,
	cover_contrast: 80,
	cover_saturate: 150
};

const TONED = { grayscale: 40, sepia: 10, brightness: 120, contrast: 80, saturate: 150 };

describe('storedPoster', () => {
	it('reads no choice and neutral filters from a new exhibition', () => {
		expect(storedPoster(NEUTRAL_COLUMNS)).toEqual({
			artworkId: null,
			imageId: null,
			crop: null,
			filters: NEUTRAL_FILTERS
		});
	});

	it('reads the chosen artwork, image, crop and filters', () => {
		expect(storedPoster(CHOSEN_COLUMNS)).toEqual({
			artworkId: 'b',
			imageId: 'b-detail',
			crop: { x: 0.25, y: 0.75, zoom: 2 },
			filters: TONED
		});
	});

	it('ignores an image and a crop left without an artwork after a purge', () => {
		expect(storedPoster({ ...CHOSEN_COLUMNS, cover_artwork_id: null })).toEqual({
			artworkId: null,
			imageId: null,
			crop: null,
			filters: TONED
		});
	});
});

describe('shownPoster', () => {
	const stored = storedPoster(CHOSEN_COLUMNS);

	it('shows the chosen artwork while the exhibition holds it', () => {
		expect(shownPoster(stored, ['a', 'b'])).toEqual(stored);
	});

	it('falls back to the first artwork with the filters but without the crop', () => {
		expect(shownPoster(stored, ['a', 'c'])).toEqual({
			artworkId: 'a',
			imageId: null,
			crop: null,
			filters: TONED
		});
	});

	it('shows no artwork in an exhibition without artworks', () => {
		expect(shownPoster(stored, []).artworkId).toBeNull();
	});
});

describe('posterChoiceMissing', () => {
	const stored = storedPoster(CHOSEN_COLUMNS);

	it('tells when the chosen artwork is not in the exhibition', () => {
		expect(posterChoiceMissing(stored, ['a'])).toBe(true);
		expect(posterChoiceMissing(stored, ['a', 'b'])).toBe(false);
		expect(posterChoiceMissing(storedPoster(NEUTRAL_COLUMNS), ['a'])).toBe(false);
	});
});

describe('posterFilter', () => {
	it('composes only the filters that change the image', () => {
		expect(posterFilter(NEUTRAL_FILTERS)).toBeUndefined();
		expect(posterFilter(TONED)).toBe(
			'grayscale(40%) sepia(10%) brightness(120%) contrast(80%) saturate(150%)'
		);
		expect(posterFilter({ ...NEUTRAL_FILTERS, sepia: 30 })).toBe('sepia(30%)');
	});
});

describe('movedCrop and zoomedCrop', () => {
	it('keeps the crop inside the image and the zoom inside its range', () => {
		expect(movedCrop(CENTRED_CROP, 0.7, -0.2)).toEqual({ x: 1, y: 0.3, zoom: 1 });
		expect(movedCrop(CENTRED_CROP, -0.6, 0)).toEqual({ x: 0, y: 0.5, zoom: 1 });
		expect(zoomedCrop(CENTRED_CROP, 4).zoom).toBe(3);
		expect(zoomedCrop(CENTRED_CROP, 0.5).zoom).toBe(1);
	});
});

describe('draggedCrop', () => {
	const frame = { width: 400, height: 500 };

	it('moves a wide image sideways by as much as the pointer moved', () => {
		const wide = { width: 1600, height: 1000 };
		expect(draggedCrop(CENTRED_CROP, -100, 0, frame, wide).x).toBeCloseTo(0.5 + 100 / 400);
		expect(draggedCrop(CENTRED_CROP, 0, 80, frame, wide).y).toBe(0.5);
	});

	it('lets a zoomed image move in both directions', () => {
		const square = { width: 1000, height: 1000 };
		const moved = draggedCrop({ x: 0.5, y: 0.5, zoom: 2 }, 100, 100, frame, square);
		expect(moved.x).toBeCloseTo(0.5 - 100 / 600);
		expect(moved.y).toBeCloseTo(0.5 - 100 / 500);
	});
});

describe('draftPoster and posterToSave', () => {
	const stored = {
		artworkId: 'gone',
		imageId: 'detail',
		crop: { x: 0.2, y: 0.4, zoom: 2 },
		filters: { ...NEUTRAL_FILTERS, sepia: 40 }
	};

	it('starts from the first artwork with the chosen filters when the choice left', () => {
		expect(draftPoster(stored, ['first'])).toEqual({ ...NO_POSTER, filters: stored.filters });
		expect(draftPoster(stored, ['first', 'gone'])).toBe(stored);
	});

	it('keeps the remembered choice when only the filters changed', () => {
		const draft = { ...NO_POSTER, filters: { ...NEUTRAL_FILTERS, contrast: 120 } };
		expect(posterToSave(draft, stored, ['first'], false)).toEqual({
			...stored,
			filters: draft.filters
		});
		expect(posterToSave(draft, stored, ['first'], true)).toBe(draft);
	});
});
