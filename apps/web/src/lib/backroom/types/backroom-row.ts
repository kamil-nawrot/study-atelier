import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { FixEntry } from './fix-entry.ts';

export type BackroomRow = {
	kind: 'artwork' | 'term' | 'symbol';
	title: string;
	artwork?: WallArtwork;
	reason: string;
	origin?: string;
	comment?: string;
	held?: boolean;
	entry: FixEntry;
};
