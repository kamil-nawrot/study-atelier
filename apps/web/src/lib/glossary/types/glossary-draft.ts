import type { WikipediaSource } from '#lib/shared/types/wikipedia-source.ts';
import type { FigureDraft } from './figure-draft.ts';
import type { GlossaryCategory } from './glossary-category.ts';
import type { GlossaryKind } from './glossary-kind.ts';

export type GlossaryDraft = {
	name: string;
	kind: GlossaryKind;
	category: GlossaryCategory | null;
	definition: string;
	synonyms: string[];
	forms: string[];
	sortByOther: boolean;
	sortName: string;
	source: WikipediaSource | null;
	figure: FigureDraft;
};
