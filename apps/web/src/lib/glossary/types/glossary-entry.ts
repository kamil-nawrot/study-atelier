import type { WikipediaSource } from '#lib/shared/types/wikipedia-source.ts';
import type { GlossaryCategory } from './glossary-category.ts';

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
