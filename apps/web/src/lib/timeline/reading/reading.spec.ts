import { describe, expect, it } from 'vitest';
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
	it('is empty when no event meets the reading line', () => {
		expect(readingText(1517, [])).toBe('');
	});

	it('names the year with the events at the reading line', () => {
		expect(readingText(1517, [event('Reformation'), event('Theses')])).toBe(
			m.timeline.now(m.atelier.year(1517, false), [m.timeline.nowEvents('Reformation, Theses')])
		);
	});
});
