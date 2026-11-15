import { describe, expect, it } from 'vitest';
import {
	NEUTRAL_FILTERS,
	posterChoiceMissing,
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
