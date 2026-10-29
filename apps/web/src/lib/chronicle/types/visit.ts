import type { PlaceType } from '#lib/catalogue/types/place-type.ts';
import type { VisitDate } from './visit-date.ts';

export type Visit = {
	id: string;
	place: string;
	placeType: PlaceType | null;
	countryCode: string | null;
	date: VisitDate;
	notes: string;
	artworkIds: string[];
};
