import { describe, expect, it } from 'vitest';
import { mapProjection } from './projection.ts';

function inside([x, y]: [number, number], width: number, height: number): boolean {
	return x >= 0 && x <= width && y >= 0 && y <= height;
}

describe('mapProjection', () => {
	it('fits every point inside the map', () => {
		const points = [
			{ latitude: 48.857, longitude: 2.35 },
			{ latitude: 43.78, longitude: 11.25 },
			{ latitude: 40.76, longitude: -73.98 }
		];
		const projection = mapProjection(points, 800, 500);

		for (const point of points) {
			const projected = projection([point.longitude, point.latitude]);
			expect(projected && inside(projected, 800, 500)).toBe(true);
		}
	});

	it('shows the surroundings of a single point and turns the map back into the point', () => {
		const projection = mapProjection([{ latitude: 48.857, longitude: 2.35 }], 600, 400);

		const paris = projection([2.35, 48.857]);
		expect(paris?.[0]).toBeCloseTo(300, 0);
		expect(paris?.[1]).toBeCloseTo(200, -1);
		const back = projection.invert?.(paris ?? [0, 0]);
		expect(back?.[0]).toBeCloseTo(2.35, 3);
		expect(back?.[1]).toBeCloseTo(48.857, 3);
	});

	it('keeps north up along every meridian', () => {
		const projection = mapProjection([{ latitude: 41.9, longitude: 12.5 }], 600, 400);

		for (const longitude of [-20, 12.5, 40]) {
			const south = projection([longitude, 30]);
			const north = projection([longitude, 60]);
			expect(north?.[0]).toBeCloseTo(south?.[0] ?? Number.NaN, 6);
			expect(north?.[1]).toBeLessThan(south?.[1] ?? Number.NaN);
		}
	});

	it('falls back to Europe without points', () => {
		const projection = mapProjection([], 600, 400);

		expect(inside(projection([2.35, 48.857]) ?? [-1, -1], 600, 400)).toBe(true);
	});
});
