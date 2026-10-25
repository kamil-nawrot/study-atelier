import type { WikipediaSource } from '#lib/shared/types/wikipedia-source.ts';

export type TimelineEvent = {
	id: string;
	name: string;
	yearFrom: number | null;
	yearTo: number;
	yearApproximate: boolean;
	description: string;
	source: WikipediaSource | null;
};
