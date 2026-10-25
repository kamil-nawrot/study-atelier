import type { GlossaryEntry } from '#lib/glossary/types/glossary-entry.ts';
import type { NoteLinks } from '@study-atelier/ui';
import type { Pin } from '#lib/pins/types/pin.ts';
import type { Preferences } from '#lib/profile/types/preferences.ts';
import type { Mention } from '#lib/notes/types/mention.ts';
import type { ValueSummaries } from '#lib/card-index/types/value-summaries.ts';
import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
import type { Visit } from '#lib/chronicle/types/visit.ts';
import type { ArtworkRecord } from './artwork-record.ts';

export type LoadArtworkResult = {
	artwork?: ArtworkRecord;
	pins?: Pin[];
	pinsError?: string;
	noteLinks?: NoteLinks;
	glossary?: GlossaryEntry[];
	mentions?: Mention[];
	visits?: Visit[];
	summaries?: ValueSummaries;
	ownFields?: OwnFieldDefinition[];
	preferences?: Preferences;
	error?: string;
	notFound?: boolean;
};
