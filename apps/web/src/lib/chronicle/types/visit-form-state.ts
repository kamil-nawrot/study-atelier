import type { VisitKind } from './visit-kind.ts';

export type VisitFormState = {
	kind: VisitKind;
	place: string[];
	placeQuery: string;
	day: string;
	month: string;
	year: string;
	endDay: string;
	endMonth: string;
	endYear: string;
	notes: string;
	chosen: string[];
	extra: string[];
};
