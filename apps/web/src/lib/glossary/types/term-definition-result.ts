import type { WikipediaSource } from '#lib/shared/types/wikipedia-source.ts';

export type TermDefinitionResult = {
	definition?: string;
	source?: WikipediaSource | null;
	notFound?: boolean;
	error?: string;
};
