import type { TimelineEvent } from './timeline-event.ts';

export type TimelineEventResult = {
	event?: TimelineEvent;
	notFound?: boolean;
	error?: string;
};
