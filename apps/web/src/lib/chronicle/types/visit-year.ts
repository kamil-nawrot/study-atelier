import type { VisitEntry } from './visit-entry.ts';

export type VisitYear = {
	year: number;
	entries: VisitEntry[];
	count: number;
};
