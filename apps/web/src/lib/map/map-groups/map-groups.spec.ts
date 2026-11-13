import { describe, expect, it } from 'vitest';
import type { MapCity } from '#lib/map/types/map-city.ts';
import {
	type CitySpot,
	groupCities,
	labelledCities,
	splitFactor,
	splitScale
} from './map-groups.ts';

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

describe('splitFactor', () => {
	it('zooms far enough for the closest pair to stand apart', () => {
		const spots: CitySpot[] = [
			{ city: rome, x: 100, y: 100 },
			{ city: vatican, x: 103, y: 100 }
		];
		const [group] = groupCities(spots, radius);

		expect(splitFactor(group, spots, radius)).toBeCloseTo(((15 + 12 + 4) / 3) * 1.2);
	});
});

describe('splitScale', () => {
	it('zooms far enough for every pair of cities to stand apart, skipping cities on one point', () => {
		const spots: CitySpot[] = [
			{ city: rome, x: 100, y: 100 },
			{ city: vatican, x: 101, y: 100 },
			{ city: paris, x: 300, y: 100 },
			{ city: city('Paryż 2', 3), x: 300, y: 100 }
		];

		expect(splitScale(spots, radius)).toBeCloseTo((15 + 12 + 4) * 1.2);
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
