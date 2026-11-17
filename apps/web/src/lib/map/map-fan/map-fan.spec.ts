import { describe, expect, it } from 'vitest';
import type { CityGroup, CitySpot, FannedCity } from '#lib/map/map-groups/map-groups.ts';
import type { MapCity } from '#lib/map/types/map-city.ts';
import { discReach, groupBox, intoView, zoomFactor, zoomsIn } from './map-fan.ts';

function city(key: string): MapCity {
	return {
		key,
		cityId: null,
		name: key,
		countryCode: null,
		point: { latitude: 0, longitude: 0 },
		places: [],
		count: 1,
		seen: 0
	};
}

function group(size: number): CityGroup {
	const cities = Array.from({ length: size }, (_, index) => city(`c${index}`));
	return { key: 'g', cities, x: 100, y: 100, radius: 20, count: size, seen: 0 };
}

describe('zoomsIn', () => {
	it('zooms into a group of more than six cities until the closest view', () => {
		expect(zoomsIn(group(6), true)).toBe(false);
		expect(zoomsIn(group(7), true)).toBe(true);
		expect(zoomsIn(group(7), false)).toBe(false);
	});
});

describe('groupBox and zoomFactor', () => {
	it('fits the places of the group into the view with a margin', () => {
		const members = group(2);
		const spots: CitySpot[] = [
			{ city: members.cities[0], x: 90, y: 80 },
			{ city: members.cities[1], x: 110, y: 100 },
			{ city: city('other'), x: 500, y: 500 }
		];
		const box = groupBox(members, spots);

		expect(box).toEqual({ left: 90, top: 80, right: 110, bottom: 100 });
		expect(zoomFactor(box, 296, 496)).toBe(10);
	});
});

describe('discReach and intoView', () => {
	const fanned = (x: number, y: number): FannedCity => ({
		...group(1),
		x,
		y,
		radius: 10,
		from: { x: 0, y: 0 }
	});

	it('reaches past the farthest city of the fan', () => {
		expect(discReach({ x: 0, y: 0 }, [fanned(30, 40), fanned(-6, 8)])).toBe(50 + 10 + 28);
	});

	it('moves a fan at the edge into the view and leaves one inside alone', () => {
		expect(intoView({ x: 40, y: 300 }, 100, 800, 600)).toEqual({ x: 60, y: 0 });
		expect(intoView({ x: 760, y: 550 }, 100, 800, 600)).toEqual({ x: -60, y: -50 });
		expect(intoView({ x: 400, y: 300 }, 100, 800, 600)).toEqual({ x: 0, y: 0 });
	});

	it('centres a fan wider than the view', () => {
		expect(intoView({ x: 100, y: 300 }, 300, 400, 800)).toEqual({ x: 100, y: 0 });
	});
});
