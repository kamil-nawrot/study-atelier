import type { GlossaryCategory } from '#lib/glossary/types/glossary-category.ts';
import type { GlossaryKind } from '#lib/glossary/types/glossary-kind.ts';
import type { AlbumTextSource } from './album-text-source.ts';

export type AlbumTerm = {
	id: string;
	revision: number;
	kind: GlossaryKind;
	category: GlossaryCategory | null;
	wikidataId: string | null;
	birthYear: number | null;
	deathYear: number | null;
	yearsApproximate: boolean;
	name: string;
	alternativeNames: string[];
	definition: string | null;
	country: string | null;
	source: AlbumTextSource | null;
};
