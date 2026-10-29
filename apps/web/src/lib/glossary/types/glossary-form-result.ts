import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
import type { GlossaryEntry } from './glossary-entry.ts';

export type GlossaryFormResult = {
	entry?: GlossaryEntry;
	entries: GlossaryEntry[];
	index: CardIndexData;
	error?: string;
	notFound?: boolean;
};
