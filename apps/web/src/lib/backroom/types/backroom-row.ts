import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { FixEntry } from './fix-entry.ts';
import type { FlagRecord } from './flag-record.ts';

export type BackroomRow = {
	kind: 'artwork' | 'term' | 'symbol' | 'event';
	title: string;
	artwork?: WallArtwork;
	reason: string;
	origin?: string;
	comment?: string;
	held?: boolean;
	flag?: FlagRecord;
	entry: FixEntry;
};
