import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import { testPlace } from '#lib/testing/map/map.ts';
import type { MapCity } from '#lib/map/types/map-city.ts';
import type { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
import CityPanel from './CityPanel.svelte';

const images = { request: vi.fn(), failed: vi.fn() } as unknown as WallImages;

const city: MapCity = {
	key: 'city:place-paryz',
	cityId: 'place-paryz',
	name: 'Paryż',
	countryCode: 'FR',
	point: { latitude: 48.857, longitude: 2.35 },
	places: [
		{
			place: testPlace('Louvre'),
			artworks: [
				testArtwork(1, 'Mona Lisa', { seen: true }),
				testArtwork(2, 'Liberty', { hasImage: false })
			]
		},
		{ place: testPlace('Notre-Dame', { placeType: 'on_site' }), artworks: [testArtwork(3, 'Rose')] }
	],
	count: 3,
	seen: 1
};

describe('CityPanel', () => {
	it('names the country and the city and counts its places and artworks', async () => {
		render(CityPanel, { city, filter: 'all', images, onclose: vi.fn() });

		await expect.element(page.getByText('Francja')).toBeVisible();
		await expect.element(page.getByRole('heading', { name: 'Paryż' })).toBeVisible();
		await expect.element(page.getByText(m.map.city.summary(2, 3, 1))).toBeVisible();
		await expect.element(page.getByText('Notre-Dame', { exact: true })).toBeVisible();
	});

	it('links every artwork, marking those seen in person', async () => {
		render(CityPanel, { city, filter: 'all', images, onclose: vi.fn() });

		await expect
			.element(page.getByRole('link', { name: `Mona Lisa, ${m.map.city.seen}` }))
			.toHaveAttribute('href', '/atelier/1');
		await expect
			.element(page.getByRole('link', { name: 'Liberty', exact: true }))
			.toHaveAttribute('href', '/atelier/2');
	});

	it('opens the wall filtered by the places of the city and closes', async () => {
		const onclose = vi.fn();
		render(CityPanel, { city, filter: 'seen', images, onclose });

		const href =
			page.getByRole('link', { name: m.map.city.showOnWall }).element().getAttribute('href') ?? '';
		const params = new URL(href, 'https://example.test').searchParams;
		expect(params.getAll('location')).toEqual(['Louvre', 'Notre-Dame']);
		expect(params.get('seen')).toBe('1');
		await page.getByRole('button', { name: m.map.city.close }).click();
		expect(onclose).toHaveBeenCalled();
	});

	it('leads to the page of the city in Kartoteka from its name and a link', async () => {
		render(CityPanel, { city, filter: 'all', images, onclose: vi.fn() });

		const path = '/atelier/values/location/place-paryz';
		await expect
			.element(page.getByRole('link', { name: m.map.city.showInCardIndex }))
			.toHaveAttribute('href', path);
		await expect.element(page.getByRole('link', { name: 'Paryż' })).toHaveAttribute('href', path);
	});

	it('leads to the page of a place without a city', async () => {
		const lonely: MapCity = {
			...city,
			key: 'place:place-lascaux',
			cityId: null,
			name: 'Lascaux',
			places: [{ place: testPlace('Lascaux'), artworks: [testArtwork(4, 'Bull')] }]
		};
		render(CityPanel, { city: lonely, filter: 'all', images, onclose: vi.fn() });

		await expect
			.element(page.getByRole('link', { name: m.map.city.showInCardIndex }))
			.toHaveAttribute('href', '/atelier/values/location/place-lascaux');
	});
});
