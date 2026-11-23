import type { GlossaryCategory } from './glossary-category.ts';
import type { GlossaryKind } from './glossary-kind.ts';

export type GlossaryTerm = {
	id: string;
	name: string;
	kind: GlossaryKind;
	category: GlossaryCategory | null;
	synonyms: string[];
	forms: string[];
	hasDefinition: boolean;
};
