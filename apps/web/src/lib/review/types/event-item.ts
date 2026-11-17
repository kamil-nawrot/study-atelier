import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
import type { EventQuestionKind } from './event-question-kind.ts';
import type { ExtraCard } from './extra-card.ts';

export type EventItem = {
	mode: 'event_year';
	kind: EventQuestionKind;
	event: TimelineEvent;
	card: ExtraCard | null;
};
