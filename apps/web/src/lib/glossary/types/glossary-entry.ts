import type { WikipediaSource } from '#lib/shared/types/wikipedia-source.ts';
import type { FigureDetails } from './figure-details.ts';
import type { GlossaryTerm } from './glossary-term.ts';

export type GlossaryEntry = GlossaryTerm & {
	definition: string;
	sortName: string | null;
	source: WikipediaSource | null;
	createdAt: string;
	figure?: FigureDetails;
};
