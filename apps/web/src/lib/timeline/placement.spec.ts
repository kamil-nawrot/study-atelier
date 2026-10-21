import { describe, expect, it } from 'vitest';
import { marksIn, seeded, spread } from './placement.ts';
import { eraOf } from './time.ts';

const earlyModern = eraOf('early_modern', 2026);

describe('marksIn', () => {
	it('puts every dated artwork of the era at its end year and leaves the rest out', () => {
		const marks = marksIn(
			[
				{ id: 'mona', yearFrom: 1503, yearTo: 1519 },
				{ id: 'none', yearFrom: null, yearTo: null },
				{ id: 'later', yearFrom: null, yearTo: 1850 },
				{ id: 'bosch', yearFrom: 1490, yearTo: 1510 }
			],
			earlyModern
		);
		expect(marks.map((mark) => mark.item.id)).toEqual(['bosch', 'mona']);
		expect(marks[1]).toMatchObject({ start: 1503, end: 1520, at: 1519.5, cutBefore: false });
		expect(marks[0]).toMatchObject({ start: 1492, cutBefore: true, cutAfter: false });
	});
});

describe('spread', () => {
	it('gives every key the same place on every call', () => {
		const keys = ['a', 'b', 'c'];
		expect(spread(keys, [0, 5, 10], 200)).toEqual(spread(keys, [0, 5, 10], 200));
		expect(seeded('a', 1)).toBe(seeded('a', 1));
	});

	it('keeps the places inside the height and does not depend on panning', () => {
		const keys = Array.from({ length: 40 }, (_, index) => `artwork-${index}`);
		const positions = keys.map((_, index) => index * 3);
		const places = spread(keys, positions, 200);
		expect(places.every((place) => place >= 0 && place < 200)).toBe(true);
		expect(
			spread(
				keys,
				positions.map((at) => at + 500),
				200
			)
		).toEqual(places);
	});

	it('moves crowded dots further apart than a plain random place would', () => {
		const keys = Array.from({ length: 30 }, (_, index) => `crowd-${index}`);
		const positions = keys.map(() => 0);
		const places = [...spread(keys, positions, 200)].sort((a, b) => a - b);
		const plain = keys.map((key) => seeded(key, 0) * 200).sort((a, b) => a - b);
		const closest = (values: number[]): number =>
			Math.min(...values.slice(1).map((value, index) => value - values[index]));
		expect(closest(places)).toBeGreaterThan(closest(plain));
	});
});
