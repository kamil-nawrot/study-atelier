import { describe, expect, it } from 'vitest';
import { drawnRibbon, namePlace, PIN_NAME_GAP } from './name-place.ts';

const bounds = { start: 0, end: 1000 };

describe('namePlace', () => {
	it('keeps a name after its pin or ribbon while it fits before the end', () => {
		expect(namePlace({ from: 500, to: 500, pin: true, inside: false, name: 120 }, bounds)).toEqual({
			before: false,
			shift: 0
		});
		expect(namePlace({ from: 400, to: 500, pin: false, inside: false, name: 120 }, bounds)).toEqual(
			{ before: false, shift: 0 }
		);
	});

	it('puts the name before a pin or ribbon that stands too close to the end', () => {
		const at = 1000 - PIN_NAME_GAP - 60;
		expect(namePlace({ from: at, to: at, pin: true, inside: false, name: 120 }, bounds)).toEqual({
			before: true,
			shift: 0
		});
		expect(namePlace({ from: 880, to: 940, pin: false, inside: false, name: 120 }, bounds)).toEqual(
			{ before: true, shift: 0 }
		);
	});

	it('leaves the name after when there is no room before it either', () => {
		expect(namePlace({ from: 960, to: 960, pin: true, inside: false, name: 990 }, bounds)).toEqual({
			before: false,
			shift: 0
		});
	});

	it('moves a name inside a ribbon that starts before the edge to the visible part', () => {
		expect(namePlace({ from: -300, to: 400, pin: false, inside: true, name: 120 }, bounds)).toEqual(
			{ before: false, shift: 300 }
		);
		expect(namePlace({ from: -300, to: 50, pin: false, inside: true, name: 120 }, bounds)).toEqual({
			before: false,
			shift: 230
		});
		expect(
			namePlace(
				{ from: 100, to: 400, pin: false, inside: true, name: 120 },
				{ start: 250, end: 1000 }
			)
		).toEqual({ before: false, shift: 150 });
	});

	it('keeps a name inside the drawn part of a ribbon that sticks out past the edge', () => {
		const drawn = drawnRibbon(-300, 200, 1000);
		expect(drawn).toEqual({ start: -4, end: 200 });
		const place = namePlace(
			{ from: drawn.start, to: drawn.end, pin: false, inside: true, name: 120 },
			bounds
		);
		expect(place).toEqual({ before: false, shift: 4 });
		expect(drawn.start + place.shift + 120).toBeLessThanOrEqual(drawn.end);
	});

	it('draws a ribbon that runs past the end only a little beyond it', () => {
		expect(drawnRibbon(900, 1600, 1000)).toEqual({ start: 900, end: 1004 });
		expect(drawnRibbon(100, 400, 1000)).toEqual({ start: 100, end: 400 });
	});

	it('keeps a ribbon that lies wholly past an edge out of the stage', () => {
		expect(drawnRibbon(-380, -150, 1000)).toEqual({ start: -150, end: -150 });
		expect(drawnRibbon(1200, 1500, 1000)).toEqual({ start: 1200, end: 1200 });
	});
});
