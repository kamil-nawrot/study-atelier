import type { VisitDate } from './visit-date.ts';

export type VisitDraft = {
	place: string;
	date: VisitDate;
	notes: string;
	artworkIds: string[];
};
