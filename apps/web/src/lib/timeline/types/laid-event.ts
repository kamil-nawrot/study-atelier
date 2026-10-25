import type { EventShape } from './event-shape.ts';
import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';

export type LaidEvent = {
	event: TimelineEvent;
	start: number;
	end: number;
	cutBefore: boolean;
	cutAfter: boolean;
	shape: EventShape;
	inside: boolean;
	lane: number;
};
