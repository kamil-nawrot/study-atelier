import type { CardIndexData } from '#lib/collection/types.ts';

export type GlossaryCategory =
	'person' | 'architecture' | 'painting' | 'sculpture' | 'technique' | 'general';

export type GlossarySource = {
	title: string;
	url: string;
	licence: string;
	fetchedOn: string;
};

export type GlossaryEntry = {
	id: string;
	name: string;
	category: GlossaryCategory;
	definition: string;
	forms: string[];
	source: GlossarySource | null;
};

export type GlossaryDraft = {
	name: string;
	category: GlossaryCategory | null;
	definition: string;
	forms: string[];
	source: GlossarySource | null;
};

export type GlossaryResult = {
	entries: GlossaryEntry[];
	error?: string;
};

export type GlossaryEntryResult = {
	entry?: GlossaryEntry;
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
