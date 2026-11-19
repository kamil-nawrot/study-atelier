import { describe, expect, it } from 'vitest';
import { drawnRibbon, PIN_NAME_GAP, placeNames, type NamedEvent } from './name-place.ts';

const bounds = { start: 0, end: 1000 };

function pin(id: string, at: number, name = 120, lane = 0): NamedEvent {
	return { id, lane, pin: true, from: at, to: at, name };
}

function ribbon(id: string, from: number, to: number, name = 120, lane = 0): NamedEvent {
	return { id, lane, pin: false, from, to, name };
}

function sides(events: NamedEvent[], within = bounds): Record<string, string> {
	return Object.fromEntries([...placeNames(events, within)].map(([id, place]) => [id, place.side]));
}

describe('placeNames', () => {
	it('puts a name inside a ribbon that holds it and after a pin or a short ribbon', () => {
		expect(sides([ribbon('long', 100, 400), pin('pin', 500), ribbon('short', 700, 740)])).toEqual({
			long: 'inside',
			pin: 'after',
			short: 'after'
		});
	});

	it('puts the name before an event that stands too close to the end', () => {
		const at = 1000 - PIN_NAME_GAP - 60;
		expect(
			sides([pin('pin', at), ribbon('short', 880, 940)].map((e, i) => ({ ...e, lane: i })))
		).toEqual({
			pin: 'before',
			short: 'before'
		});
	});

	it('puts the name before an event when the next event of its lane leaves no room after it', () => {
		expect(sides([pin('first', 100), pin('second', 400), pin('third', 470)])).toEqual({
			first: 'after',
			second: 'before',
			third: 'after'
		});
	});

	it('leaves out a name that has no room on either side', () => {
		expect(sides([pin('a', 300), pin('b', 380), pin('c', 460)])).toEqual({
			a: 'before',
			b: 'none',
			c: 'after'
		});
	});

	it('never lets two names of a lane overlap, but ignores the other lanes', () => {
		expect(sides([pin('a', 300), pin('b', 360), pin('c', 330, 120, 1)])).toEqual({
			a: 'before',
			b: 'after',
			c: 'after'
		});
	});

	it('keeps a name out of the part of the stage outside the era', () => {
		expect(sides([pin('a', 300)], { start: 250, end: 500 })).toEqual({ a: 'after' });
		expect(sides([pin('a', 300, 300)], { start: 250, end: 500 })).toEqual({ a: 'none' });
	});

	it('moves a name inside a ribbon that starts before the edge to the visible part', () => {
		expect(placeNames([ribbon('a', -300, 400)], bounds).get('a')).toEqual({
			side: 'inside',
			shift: 300
		});
		expect(placeNames([ribbon('a', 100, 400)], { start: 250, end: 1000 }).get('a')).toEqual({
			side: 'inside',
			shift: 150
		});
	});

	it('puts the name outside a ribbon whose drawn part is too short for it', () => {
		const drawn = drawnRibbon(-300, 60, 1000);
		expect(sides([ribbon('a', drawn.start, drawn.end)])).toEqual({ a: 'after' });
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
