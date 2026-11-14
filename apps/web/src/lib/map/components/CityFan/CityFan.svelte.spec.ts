import { describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { m } from '#lib/i18n/i18n.ts';
import type { FannedCity } from '#lib/map/map-groups/map-groups.ts';
import type { MapCity } from '#lib/map/types/map-city.ts';
import CityFan from './CityFan.svelte';

function fanned(name: string, count: number, y: number): FannedCity {
	const city: MapCity = {
		key: name,
		cityId: null,
		name,
		countryCode: 'IT',
		point: { latitude: 0, longitude: 0 },
		places: [],
		count,
		seen: 0
	};
	return {
		key: name,
		cities: [city],
		x: 100,
		y,
		radius: 12,
		count,
		seen: 0,
		from: { x: 100, y: 100 }
	};
}

describe('CityFan', () => {
	it('shows every city of the group with its name and a line to its own place', async () => {
		const onselect = vi.fn();
		const cities = [fanned('Rzym', 12, 60), fanned('Watykan', 3, 140)];
		render(CityFan, { cities, selected: 'Watykan', narrow: false, onselect });

		await expect.element(page.getByText('Rzym')).toBeVisible();
		const vatican = page.getByRole('button', { name: `Watykan, ${m.map.city.artworks(3)}` });
		await expect.element(vatican).toHaveAttribute('aria-pressed', 'true');
		expect(document.querySelectorAll('.leaders line')).toHaveLength(2);

		await vatican.click();
		expect(onselect).toHaveBeenCalledWith(cities[1].cities[0]);
	});
});
