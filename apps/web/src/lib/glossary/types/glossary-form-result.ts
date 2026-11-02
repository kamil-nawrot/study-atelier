import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
import type { GlossaryEntry } from './glossary-entry.ts';
import type { GlossaryTerm } from './glossary-term.ts';

export type GlossaryFormResult = {
	entry?: GlossaryEntry;
	entries: GlossaryTerm[];
	index: CardIndexData;
	error?: string;
	notFound?: boolean;
};
