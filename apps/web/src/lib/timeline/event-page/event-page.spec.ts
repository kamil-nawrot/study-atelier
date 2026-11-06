import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
import { artworksOfEvent, eventEditPath, eventPath, isSpan } from './event-page.ts';

const paxRomana: TimelineEvent = {
	id: 'e',
	name: 'Pax Romana',
	yearFrom: -27,
	yearTo: 180,
	yearApproximate: true,
	description: '',
	source: null
};

const artworks = [
	testArtwork(1, 'Pantheon', { yearFrom: null, yearTo: 125 }),
	testArtwork(2, 'Ara Pacis', { yearFrom: -13, yearTo: -9 }),
	testArtwork(3, 'Parthenon', { yearFrom: -447, yearTo: -432 }),
	testArtwork(4, 'Undated', { yearFrom: null, yearTo: null })
];

describe('event page', () => {
	it('builds the paths of the event page and its form', () => {
		expect(eventPath('e')).toBe('/atelier/timeline/events/e');
		expect(eventEditPath('e')).toBe('/atelier/timeline/events/e/edit');
	});

	it('tells a span from a single moment', () => {
		expect(isSpan(paxRomana)).toBe(true);
		expect(isSpan({ yearFrom: null, yearTo: 966 })).toBe(false);
		expect(isSpan({ yearFrom: 966, yearTo: 966 })).toBe(false);
	});

	it('lists the dated artworks of its time in chronological order', () => {
		expect(artworksOfEvent(artworks, paxRomana).map((artwork) => artwork.title)).toEqual([
			'Ara Pacis',
			'Pantheon'
		]);
	});
});
