import type { WikipediaSource } from '#lib/shared/types/wikipedia-source.ts';

export type TimelineEventDraft = {
	name: string;
	yearFrom: number | null;
	yearTo: number | null;
	yearApproximate: boolean;
	description: string;
	source: WikipediaSource | null;
};
