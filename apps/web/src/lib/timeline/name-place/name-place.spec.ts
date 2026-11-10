import { describe, expect, it } from 'vitest';
import { namePlace, PIN_NAME_GAP } from './name-place.ts';

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
});
