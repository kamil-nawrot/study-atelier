import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
import type { ValueDetails } from '#lib/values/types/value-details.ts';
import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';

export type ItemMatches = {
	entries: GlossaryEntry[];
	events: TimelineEvent[];
	records: CardIndexRecord[];
	details: Record<string, ValueDetails>;
};
