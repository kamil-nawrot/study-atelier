import type { VisitDate } from './visit-date.ts';
import type { VisitKind } from './visit-kind.ts';

export type VisitDraft = {
	kind: VisitKind;
	place: string;
	date: VisitDate;
	endsOn: string | null;
	notes: string;
	artworkIds: string[];
};
