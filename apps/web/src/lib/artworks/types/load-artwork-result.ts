import type { GlossaryEntry } from '#lib/glossary/types.ts';
import type { NoteLinks } from '@study-atelier/ui';
import type { Pin } from '#lib/pins/types.ts';
import type { Preferences } from '#lib/profile/types.ts';
import type { Mention } from '#lib/notes/mentions-data/mentions-data.ts';
import type { ValueSummaries } from '#lib/card-index/value-summaries/value-summaries.ts';
import type { OwnFieldDefinition } from '#lib/card-index/types/own-field-definition.ts';
import type { ArtworkRecord } from './artwork-record.ts';

export type LoadArtworkResult = {
	artwork?: ArtworkRecord;
	pins?: Pin[];
	pinsError?: string;
	noteLinks?: NoteLinks;
	glossary?: GlossaryEntry[];
	mentions?: Mention[];
	summaries?: ValueSummaries;
	ownFields?: OwnFieldDefinition[];
	preferences?: Preferences;
	error?: string;
	notFound?: boolean;
};
