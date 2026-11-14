import { describe, expect, it } from 'vitest';
import { testTowns } from '#lib/testing/map/map.ts';
import { distanceKm, nearestTown } from './towns.ts';

describe('distanceKm', () => {
	it('measures the distance along the surface of the Earth', () => {
		expect(
			distanceKm({ latitude: 48.857, longitude: 2.35 }, { latitude: 52.52, longitude: 13.4 })
		).toBeCloseTo(878, -1);
	});
});

describe('nearestTown', () => {
	const towns = testTowns();

	it('takes the nearest town within reach', () => {
		expect(nearestTown({ latitude: 48.8, longitude: 2.12 }, towns)?.name).toBe('Paryż');
	});

	it('gives a starter museum the town nearest to its point within 40 km', () => {
		expect(nearestTown({ latitude: 48.86111, longitude: 2.33583 }, towns)?.name).toBe('Paryż');
		expect(nearestTown({ latitude: 49.3, longitude: 2.35 }, towns)).toBeNull();
	});

	it('takes no town when every one is farther than the reach', () => {
		expect(nearestTown({ latitude: 50.06, longitude: 19.94 }, towns)).toBeNull();
	});
});
