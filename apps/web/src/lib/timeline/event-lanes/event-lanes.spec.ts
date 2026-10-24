import { describe, expect, it } from 'vitest';
import { eventsIn, lanesForEra, layEvents, yearsLong } from './event-lanes.ts';
import { eraOf } from '#lib/timeline/time/time.ts';
import type { TimelineEvent } from '#lib/timeline/types.ts';

const earlyModern = eraOf('early_modern', 2026);

function event(id: string, yearFrom: number | null, yearTo: number, name = id): TimelineEvent {
	return { id, name, yearFrom, yearTo, yearApproximate: false, description: '', source: null };
}

const width = (item: TimelineEvent): number => item.name.length * 7;

describe('layEvents', () => {
	it('keeps the events of the era, cut at its edges', () => {
		const laid = layEvents(
			[event('industry', 1760, 1840), event('war', 1914, 1918), event('america', null, 1492)],
			earlyModern,
			4,
			width
		);
		expect(laid.map((item) => item.event.id)).toEqual(['america', 'industry']);
		expect(laid[1]).toMatchObject({ start: 1760, end: 1789, cutAfter: true, cutBefore: false });
	});

	it('draws a single year and a short period as a pin, a long one as a ribbon', () => {
		const laid = layEvents(
			[event('treaty', null, 1648), event('plague', 1665, 1666), event('thirty', 1618, 1648)],
			earlyModern,
			4,
			width
		);
		const shape = (id: string): string | undefined =>
			laid.find((item) => item.event.id === id)?.shape;
		expect(shape('treaty')).toBe('pin');
		expect(shape('plague')).toBe('pin');
		expect(shape('thirty')).toBe('ribbon');
	});

	it('puts overlapping events into separate lanes counting their names', () => {
		const laid = layEvents(
			[
				event('a', 1600, 1650, 'Wojna'),
				event('b', 1640, 1700, 'Pokój'),
				event('c', 1720, 1740, 'Inne')
			],
			earlyModern,
			4,
			width
		);
		const lane = (id: string): number | undefined =>
			laid.find((item) => item.event.id === id)?.lane;
		expect(lane('a')).toBe(0);
		expect(lane('b')).toBe(1);
		expect(lane('c')).toBe(0);
	});
});

describe('lanesForEra', () => {
	it('takes the most lanes the era needs at any of its steps, up to the cap', () => {
		const events = [event('a', 1600, 1650), event('b', 1610, 1660), event('c', 1620, 1670)];
		expect(lanesForEra(events, earlyModern, 1000, width, 4)).toBe(3);
		expect(lanesForEra(events, earlyModern, 1000, width, 2)).toBe(2);
		expect(lanesForEra([], earlyModern, 1000, width, 4)).toBe(1);
	});
});

describe('eventsIn and yearsLong', () => {
	it('finds the events of a time and their length in years', () => {
		const thirty = event('thirty', 1618, 1648);
		expect(eventsIn([thirty], eraOf('modern', 2026))).toEqual([]);
		expect(eventsIn([thirty, event('x', null, 1700)], { start: 1640, end: 1641 })).toEqual([
			thirty
		]);
		expect(yearsLong(thirty)).toBe(30);
		expect(yearsLong(event('pax', -27, 180))).toBe(206);
		expect(yearsLong(event('jesus', null, -4))).toBe(0);
	});
});
