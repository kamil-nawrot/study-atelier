import { describe, expect, it } from 'vitest';
import { testArtwork } from '#lib/catalogue/test-artwork/test-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
import { readingText } from './reading.ts';

function event(name: string): TimelineEvent {
	return {
		id: name,
		name,
		yearFrom: null,
		yearTo: 1517,
		yearApproximate: false,
		description: '',
		source: null
	};
}

describe('reading text', () => {
	it('is empty when nothing meets the reading line', () => {
		expect(readingText(1517, [], [])).toBe('');
	});

	it('names the year with the events and the first artworks', () => {
		const artworks = ['One', 'Two', 'Three', 'Four'].map((title, index) =>
			testArtwork(index + 1, title)
		);

		expect(readingText(1517, [event('Reformation')], artworks)).toBe(
			m.timeline.now(m.atelier.year(1517, false), [
				m.timeline.nowEvents('Reformation'),
				m.timeline.nowArtworks('One, Two, Three', 1)
			])
		);
	});

	it('leaves out the events when only artworks meet the line', () => {
		expect(readingText(1517, [], [testArtwork(1, 'One')])).toBe(
			m.timeline.now(m.atelier.year(1517, false), [m.timeline.nowArtworks('One', -2)])
		);
	});
});
