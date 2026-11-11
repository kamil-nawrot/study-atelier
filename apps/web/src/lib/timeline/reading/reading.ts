import { m } from '#lib/i18n/i18n.ts';
import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';

export function readingText(year: number, events: readonly TimelineEvent[]): string {
	if (events.length === 0) return '';
	return m.timeline.now(m.atelier.year(year, false), [
		m.timeline.nowEvents(events.map((event) => event.name).join(', '))
	]);
}
