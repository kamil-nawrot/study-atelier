import type { ArtworkTypeCode } from './artwork-type-code.ts';
import type { EraCode } from './era-code.ts';
import type { MissingData } from './missing-data.ts';

export type CollectionFilter = {
	favourites: boolean;
	seen: boolean;
	eras: EraCode[];
	types: ArtworkTypeCode[];
	yearFrom: number | null;
	yearTo: number | null;
	authors: string[];
	unknownAuthor: boolean;
	periods: string[];
	styles: string[];
	materials: string[];
	locations: string[];
	missing: MissingData[];
	own: Record<string, string[]>;
	ownTexts: Record<string, string>;
	ticked: string[];
};
