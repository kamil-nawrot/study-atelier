import type { WikipediaSource } from '#lib/shared/types/wikipedia-source.ts';

export type EventFormState = {
	name: string;
	spanMode: boolean;
	yearFrom: string;
	fromBeforeCommonEra: boolean;
	yearTo: string;
	toBeforeCommonEra: boolean;
	yearApproximate: boolean;
	description: string;
	source: WikipediaSource | null;
};
