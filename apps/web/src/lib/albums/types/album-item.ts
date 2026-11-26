import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';
import type { ValueDetails } from '#lib/values/types/value-details.ts';
import type { CardIndexRecord } from '#lib/catalogue/types/card-index-record.ts';
import type { AlbumEvent } from './album-event.ts';
import type { AlbumItemPart } from './album-item-part.ts';
import type { AlbumItemState } from './album-item-state.ts';
import type { AlbumTerm } from './album-term.ts';
import type { AlbumValue } from './album-value.ts';

type Source =
	| { kind: 'term'; term: AlbumTerm; existing?: GlossaryEntry }
	| { kind: 'event'; event: AlbumEvent; existing?: TimelineEvent }
	| {
			kind: 'value';
			value: AlbumValue;
			record?: CardIndexRecord;
			existingDetails?: ValueDetails;
	  };

export type AlbumItem = Source & {
	key: string;
	part: AlbumItemPart;
	title: string;
	excerpt: string | null;
	state: AlbumItemState;
	related: boolean;
};
