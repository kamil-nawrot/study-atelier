import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { CityGroup } from '#lib/map/map-groups/map-groups.ts';
import type { MapCity } from '#lib/map/types/map-city.ts';
import CityMarker from './CityMarker.svelte';

function city(name: string, count: number): MapCity {
	return {
		key: name,
		name,
		countryCode: 'IT',
		point: { latitude: 0, longitude: 0 },
		places: [],
		count,
		seen: 0
	};
}

function group(cities: MapCity[]): CityGroup {
	const count = cities.reduce((sum, shown) => sum + shown.count, 0);
	return { key: cities[0].key, cities, x: 100, y: 100, radius: 12, count, seen: 0 };
}

describe('CityMarker', () => {
	it('hides the name of a city that is not labelled', async () => {
		const onclick = vi.fn();
		render(CityMarker, {
			group: group([city('Rzym', 5)]),
			selected: false,
			labelled: false,
			narrow: false,
			onclick
		});
		const button = page.getByRole('button', { name: `Rzym, ${m.map.city.artworks(5)}` });

		await expect.element(button).toHaveAttribute('aria-pressed', 'false');
		await expect.element(page.getByText('Rzym')).not.toBeVisible();
		await button.click();
		expect(onclick).toHaveBeenCalledTimes(1);
	});

	it('shows the name of a labelled city', async () => {
		render(CityMarker, {
			group: group([city('Rzym', 5)]),
			selected: false,
			labelled: true,
			narrow: false,
			onclick: vi.fn()
		});

		await expect.element(page.getByText('Rzym')).toBeVisible();
	});

	it('shows a group with the sum and no name', async () => {
		render(CityMarker, {
			group: group([city('Rzym', 5), city('Watykan', 2)]),
			selected: false,
			labelled: false,
			narrow: false,
			onclick: vi.fn()
		});
		const button = page.getByRole('button', { name: m.map.group(['Rzym', 'Watykan'], 7) });

		await expect.element(button).toHaveTextContent('7');
		await expect.element(button).not.toHaveAttribute('aria-pressed');
	});
});
