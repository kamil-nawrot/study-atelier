import type { Mention } from '#lib/notes/mentions-data/mentions-data.ts';
import type { GlossaryEntry } from './glossary-entry.ts';
import type { PinnedArtwork } from './pinned-artwork.ts';

export type GlossaryEntryResult = {
	entry?: GlossaryEntry;
	mentions?: Mention[];
	glossary?: GlossaryEntry[];
	pinned?: PinnedArtwork[];
	pinnedError?: string;
	error?: string;
	notFound?: boolean;
};
