import type { PlaceType } from '#lib/catalogue/types/place-type.ts';
import type { VisitDate } from './visit-date.ts';
import type { VisitKind } from './visit-kind.ts';

export type Visit = {
	id: string;
	kind: VisitKind;
	place: string;
	placeType: PlaceType | null;
	countryCode: string | null;
	date: VisitDate;
	endsOn: string | null;
	tripId: string | null;
	notes: string;
	artworkIds: string[];
};
