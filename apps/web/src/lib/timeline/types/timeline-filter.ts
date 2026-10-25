import type { ArtworkTypeCode } from '#lib/catalogue/types/artwork-type-code.ts';
import type { Lane } from './lane.ts';

export type TimelineFilter = {
	lanes: Lane[];
	favourites: boolean;
	types: ArtworkTypeCode[];
	authors: string[];
	unknownAuthor: boolean;
};
