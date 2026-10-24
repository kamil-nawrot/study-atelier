import type { WikipediaSource } from '#lib/shared/types/wikipedia-source.ts';
import type { GlossaryCategory } from './glossary-category.ts';

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
