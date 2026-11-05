import type { Mention } from '#lib/notes/types/mention.ts';
import type { GlossaryEntry } from './glossary-entry.ts';
import type { GlossaryTerm } from './glossary-term.ts';
import type { PinnedArtwork } from './pinned-artwork.ts';
import type { TermFragment } from './term-fragment.ts';

export type GlossaryEntryResult = {
	entry?: GlossaryEntry;
	mentions?: Mention[];
	glossary?: GlossaryTerm[];
	pinned?: PinnedArtwork[];
	fragments?: TermFragment[];
	pinnedError?: string;
	error?: string;
	notFound?: boolean;
};
