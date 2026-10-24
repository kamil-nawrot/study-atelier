import type { Mention } from '#lib/collection/mentions.ts';
import type { CardIndexData, WallArtwork } from '#lib/collection/types.ts';
import type { WikipediaSource } from '#lib/shared/types/wikipedia-source.ts';

export type GlossaryCategory =
	'person' | 'architecture' | 'painting' | 'sculpture' | 'technique' | 'general';

export type GlossaryEntry = {
	id: string;
	name: string;
	category: GlossaryCategory;
	definition: string;
	synonyms: string[];
	forms: string[];
	sortName: string | null;
	source: WikipediaSource | null;
};

export type GlossaryDraft = {
	name: string;
	category: GlossaryCategory | null;
	definition: string;
	synonyms: string[];
	forms: string[];
	sortByOther: boolean;
	sortName: string;
	source: WikipediaSource | null;
};

export type GlossaryResult = {
	entries: GlossaryEntry[];
	error?: string;
};

export type GlossaryEntryResult = {
	entry?: GlossaryEntry;
	mentions?: Mention[];
	glossary?: GlossaryEntry[];
	pinned?: PinnedArtwork[];
	pinnedError?: string;
	error?: string;
	notFound?: boolean;
};

export type GlossaryFormResult = {
	entry?: GlossaryEntry;
	entries: GlossaryEntry[];
	index: CardIndexData;
	error?: string;
	notFound?: boolean;
};

export type WikipediaArticle = {
	title: string;
	url: string;
	extract: string;
};

export type PinnedArtwork = {
	artwork: WallArtwork;
	pinId: string;
};
