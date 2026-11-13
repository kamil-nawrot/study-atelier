import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import { searchWikidataPlaces } from '#lib/images/wikidata-places/wikidata-places.ts';
import { loadGeography } from '#lib/map/geography/geography.ts';
import { setPlacePoint } from '#lib/map/places-data/places-data.ts';
import { testGeography, testPlace } from '#lib/testing/map/map.ts';
import type { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
import MapView from './MapView.svelte';

vi.mock('#lib/images/wikidata-places/wikidata-places.ts', () => ({
	searchWikidataPlaces: vi.fn()
}));
vi.mock('#lib/map/geography/geography.ts', () => ({ loadGeography: vi.fn() }));
vi.mock('#lib/map/places-data/places-data.ts', () => ({ setPlacePoint: vi.fn() }));

const images = {
	request: vi.fn(),
	failed: vi.fn(),
	apply: (list: unknown) => list
} as unknown as WallImages;

const places = [
	testPlace('Louvre', { point: { latitude: 48.86111, longitude: 2.33583 } }),
	testPlace('Uffizi', { point: { latitude: 43.76778, longitude: 11.25528 } }),
	testPlace('Rzym'),
	testPlace('Belvedere')
];

const artworks = [
	testArtwork(1, 'Mona Lisa', { location: 'Louvre', seen: true }),
	testArtwork(2, 'Primavera', { location: 'Uffizi' }),
	testArtwork(3, 'Pieta', { location: 'Rzym' }),
	testArtwork(4, 'Moses', { location: 'Rzym' }),
	testArtwork(5, 'The Kiss', { location: 'Belvedere' })
];

describe('MapView', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		await page.viewport(1280, 900);
		vi.mocked(loadGeography).mockResolvedValue(testGeography());
		vi.mocked(searchWikidataPlaces).mockResolvedValue([]);
		vi.mocked(setPlacePoint).mockResolvedValue({});
	});

	it('shows the cities with the filters and opens the panel of a city', async () => {
		render(MapView, { places, artworks, images });

		await expect.element(page.getByText(m.map.lead)).toBeVisible();
		await expect.element(page.getByText(m.map.missing(2))).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: /Wszystkie/ }))
			.toHaveAttribute('aria-pressed', 'true');
		await page.getByRole('button', { name: /^Paryż/ }).click();
		await expect.element(page.getByRole('heading', { name: 'Paryż' })).toBeVisible();

		await page.getByRole('button', { name: m.map.city.close }).click();
		await expect.element(page.getByRole('heading', { name: 'Paryż' })).not.toBeInTheDocument();
	});

	it('narrows the cities to a filter and says when it holds nothing', async () => {
		render(MapView, { places, artworks, images });

		await page.getByRole('button', { name: /Widziane na żywo/ }).click();
		await expect.element(page.getByRole('button', { name: /^Florencja/ })).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /^Paryż/ })).toBeVisible();

		await page.getByRole('button', { name: /Chcę zobaczyć/ }).click();
		await expect.element(page.getByText(m.map.emptyWantToSee)).toBeVisible();
		await page.getByRole('button', { name: /Chcę zobaczyć/ }).click();
		await expect
			.element(page.getByRole('button', { name: /Chcę zobaczyć/ }))
			.toHaveAttribute('aria-pressed', 'true');
	});

	it('walks through the places without a point, most artworks first', async () => {
		render(MapView, { places, artworks, images });

		await page.getByRole('button', { name: m.map.fillStart }).click();
		await expect.element(page.getByRole('heading', { name: 'Rzym' })).toBeVisible();
		await page.getByRole('button', { name: m.map.fill.skip }).click();
		await expect.element(page.getByRole('heading', { name: 'Belvedere' })).toBeVisible();
		await page.getByRole('button', { name: m.map.fill.skip }).click();
		await expect.element(page.getByText(m.map.fill.done)).toBeVisible();
		await page.getByRole('button', { name: m.map.fill.close }).click();
		await expect.element(page.getByText(m.map.missing(2))).toBeVisible();
	});

	it('shows the empty map when no place has a point', async () => {
		render(MapView, { places: [testPlace('Rzym')], artworks, images });

		await expect.element(page.getByText(m.map.emptyTitle)).toBeVisible();
		await expect.element(page.getByText(m.map.missing(1))).toBeVisible();
	});

	it('says the map could not load', async () => {
		vi.mocked(loadGeography).mockRejectedValue(new Error('offline'));
		render(MapView, { places, artworks, images });

		await expect.element(page.getByText(m.map.loadError)).toBeVisible();
	});
});
