import type { GlossaryCategory } from './glossary-category.ts';

export type GlossaryTerm = {
	id: string;
	name: string;
	category: GlossaryCategory;
	synonyms: string[];
	forms: string[];
	hasDefinition: boolean;
};
