import { describe, expect, it } from 'vitest';
import type { MapCity } from '#lib/map/types/map-city.ts';
import { type CitySpot, fanOut, groupCities, labelledCities } from './map-groups.ts';

function city(key: string, count: number, seen = 0): MapCity {
	return {
		key,
		name: key,
		countryCode: null,
		point: { latitude: 0, longitude: 0 },
		places: [],
		count,
		seen
	};
}

const radius = (count: number): number => 10 + count;
const rome = city('Rzym', 5, 1);
const vatican = city('Watykan', 2);
const paris = city('Paryż', 3);

describe('groupCities', () => {
	it('joins overlapping cities into one group on the place of the largest', () => {
		const spots: CitySpot[] = [
			{ city: vatican, x: 103, y: 100 },
			{ city: rome, x: 100, y: 100 },
			{ city: paris, x: 400, y: 100 }
		];

		const groups = groupCities(spots, radius);

		expect(groups).toHaveLength(2);
		expect(groups[0]).toMatchObject({ x: 100, y: 100, count: 7, seen: 1, radius: 17 });
		expect(groups[0].cities).toEqual([rome, vatican]);
		expect(groups[1]).toMatchObject({ key: 'Paryż', count: 3, radius: 13 });
	});

	it('joins a city that the grown group reaches', () => {
		const spots: CitySpot[] = [
			{ city: rome, x: 100, y: 100 },
			{ city: vatican, x: 110, y: 100 },
			{ city: city('Tivoli', 1), x: 130, y: 100 }
		];

		expect(groupCities(spots, radius)).toHaveLength(1);
	});
});

describe('fanOut', () => {
	it('spreads the cities of a group around it, keeping their own places as the start of a line', () => {
		const spots: CitySpot[] = [
			{ city: rome, x: 100, y: 100 },
			{ city: vatican, x: 101, y: 100 }
		];
		const [group] = groupCities(spots, radius);

		const fanned = fanOut(group, spots, radius, () => 60);

		expect(fanned.map((city) => city.key)).toEqual(['Rzym', 'Watykan']);
		expect(fanned[0]).toMatchObject({ count: 5, radius: 15, from: { x: 100, y: 100 } });
		expect(fanned[0].x).toBeCloseTo(100);
		expect(fanned[0].y).toBeCloseTo(100 - 32);
		expect(fanned[1].x).toBeCloseTo(100);
		expect(fanned[1].y).toBeCloseTo(100 + 32);
		expect(fanned[1].from).toEqual({ x: 101, y: 100 });
	});
});

describe('labelledCities', () => {
	const size = (): { width: number; height: number } => ({ width: 60, height: 20 });

	it('names the largest cities whose names do not cross another name or circle', () => {
		const spots: CitySpot[] = [
			{ city: rome, x: 100, y: 100 },
			{ city: paris, x: 150, y: 95 },
			{ city: city('Wiedeń', 1), x: 400, y: 100 }
		];
		const groups = groupCities(spots, radius);

		expect(labelledCities(groups, size)).toEqual(new Set(['Rzym', 'Wiedeń']));
	});

	it('names the selected city first', () => {
		const spots: CitySpot[] = [
			{ city: rome, x: 100, y: 100 },
			{ city: paris, x: 150, y: 95 }
		];
		const groups = groupCities(spots, radius);

		expect(labelledCities(groups, size, 'Paryż')).toEqual(new Set(['Paryż']));
	});

	it('gives no name to a group', () => {
		const spots: CitySpot[] = [
			{ city: rome, x: 100, y: 100 },
			{ city: vatican, x: 103, y: 100 }
		];

		expect(labelledCities(groupCities(spots, radius), size)).toEqual(new Set());
	});
});
