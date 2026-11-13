import { describe, expect, it, vi } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { loadMapPlaces } from '#lib/map/places-data/places-data.ts';
import { testPlace } from '#lib/testing/map/map.ts';
import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
import { loadMap } from './map-page-data.ts';

vi.mock('#lib/wall/wall-data/wall-data.ts', () => ({ loadAtelier: vi.fn() }));
vi.mock('#lib/map/places-data/places-data.ts', () => ({ loadMapPlaces: vi.fn() }));

describe('loadMap', () => {
	it('loads the collection and the places together', async () => {
		const artworks = [testArtwork(1, 'Mona Lisa')];
		const places = [testPlace('Louvre')];
		vi.mocked(loadAtelier).mockResolvedValue({ artworks });
		vi.mocked(loadMapPlaces).mockResolvedValue({ places, error: 'places failed' });

		await expect(loadMap()).resolves.toEqual({ artworks, places, error: 'places failed' });
	});
});
