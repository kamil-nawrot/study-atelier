import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import { loadGeography } from '#lib/map/geography/geography.ts';
import { testGeography, testPlace } from '#lib/testing/map/map.ts';
import type { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
import MapView from './MapView.svelte';

vi.mock('#lib/map/geography/geography.ts', () => ({ loadGeography: vi.fn() }));

const images = {
	request: vi.fn(),
	failed: vi.fn(),
	apply: (list: unknown) => list
} as unknown as WallImages;

const paris = testPlace('Paryż', {
	placeType: 'city',
	countryCode: 'FR',
	point: { latitude: 48.857, longitude: 2.35 }
});
const florence = testPlace('Florencja', {
	placeType: 'city',
	countryCode: 'IT',
	point: { latitude: 43.78, longitude: 11.25 }
});

const places = [
	paris,
	florence,
	testPlace('Louvre', { cityId: paris.id }),
	testPlace('Uffizi', { cityId: florence.id }),
	testPlace('Rzym', { placeType: 'city' }),
	testPlace('Belvedere')
];

const artworks = [
	testArtwork(1, 'Mona Lisa', { location: 'Louvre', seen: true }),
	testArtwork(2, 'Primavera', { location: 'Uffizi' }),
	testArtwork(3, 'Pieta', { location: 'Rzym' }),
	testArtwork(4, 'The Kiss', { location: 'Belvedere' })
];

describe('MapView', () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		await page.viewport(1280, 900);
		vi.mocked(loadGeography).mockResolvedValue(testGeography());
	});

	it('shows the cities with the filters and opens the panel of a city', async () => {
		render(MapView, { places, artworks, images });

		await expect.element(page.getByText(m.map.lead)).toBeVisible();
		await expect
			.element(page.getByRole('button', { name: /Wszystkie/ }))
			.toHaveAttribute('aria-pressed', 'true');
		await page.getByRole('button', { name: /^Paryż/ }).click();
		await expect.element(page.getByRole('heading', { name: 'Paryż' })).toBeVisible();
		await expect
			.element(page.getByRole('link', { name: m.map.city.showInCardIndex }))
			.toBeVisible();

		await page.getByRole('button', { name: m.map.city.close }).click();
		await expect.element(page.getByRole('heading', { name: 'Paryż' })).not.toBeInTheDocument();
	});

	it('narrows the cities to a filter and shows none when it holds nothing', async () => {
		render(MapView, { places, artworks, images });

		await page.getByRole('button', { name: /Widziane na żywo/ }).click();
		await expect.element(page.getByRole('button', { name: /^Florencja/ })).not.toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: /^Paryż/ })).toBeVisible();

		await page.getByRole('button', { name: /Chcę zobaczyć/ }).click();
		await expect.element(page.getByRole('button', { name: /^Paryż/ })).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: /Chcę zobaczyć/ }))
			.toHaveAttribute('aria-pressed', 'true');
	});

	it('shows the empty map when no place reaches it', async () => {
		render(MapView, { places: [testPlace('Belvedere')], artworks, images });

		await expect.element(page.getByText(m.map.emptyTitle)).toBeVisible();
	});

	it('says the map could not load', async () => {
		vi.mocked(loadGeography).mockRejectedValue(new Error('offline'));
		render(MapView, { places, artworks, images });

		await expect.element(page.getByText(m.map.loadError)).toBeVisible();
	});
});
