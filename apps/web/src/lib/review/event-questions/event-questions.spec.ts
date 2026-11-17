import { describe, expect, it } from 'vitest';
import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
import { askedYear, eraOfYear, eventBounds, eventItems } from './event-questions.ts';

const JUNCTIONS = [-3000, 476, 1492, 1789, 1945];
const today = new Date('2026-11-17T12:00:00.000Z');

function event(id: string, yearFrom: number | null, yearTo: number): TimelineEvent {
	return {
		id,
		name: id,
		yearFrom,
		yearTo,
		yearApproximate: false,
		description: '',
		source: null
	};
}

describe('eraOfYear', () => {
	it('finds the era of a year and takes the later era at a junction', () => {
		expect(eraOfYear(-5000, JUNCTIONS)).toBe('prehistory');
		expect(eraOfYear(475, JUNCTIONS)).toBe('antiquity');
		expect(eraOfYear(476, JUNCTIONS)).toBe('middle_ages');
		expect(eraOfYear(1618, JUNCTIONS)).toBe('early_modern');
		expect(eraOfYear(2001, JUNCTIONS)).toBe('contemporary');
	});
});

describe('askedYear', () => {
	it('asks a period for the end of the question and a single year for that year', () => {
		const war = event('war', 1618, 1648);
		expect(askedYear({ event: war, kind: 'start' })).toBe(1618);
		expect(askedYear({ event: war, kind: 'end' })).toBe(1648);
		expect(askedYear({ event: event('battle', null, 1410), kind: 'year' })).toBe(1410);
	});
});

describe('eventBounds', () => {
	it('spans the era of the asked year', () => {
		expect(eventBounds(1618, today)).toEqual([1492, 1789]);
		expect(eventBounds(476, today)).toEqual([476, 1492]);
		expect(eventBounds(2001, today)).toEqual([1945, 2026]);
	});

	it('reaches a year older than the start of prehistory', () => {
		expect(eventBounds(-50000, today)).toEqual([-50000, -3000]);
	});
});

describe('eventItems', () => {
	it('keeps the order of the round and leaves out an event that is gone', () => {
		const items = eventItems(
			[
				{ eventId: 'war', kind: 'end', card: null },
				{ eventId: 'gone', kind: 'year', card: null },
				{ eventId: 'battle', kind: 'year', card: null }
			],
			[event('battle', null, 1410), event('war', 1618, 1648)]
		);
		expect(items.map((item) => [item.event.id, item.kind])).toEqual([
			['war', 'end'],
			['battle', 'year']
		]);
		expect(items[0].mode).toBe('event_year');
	});
});
