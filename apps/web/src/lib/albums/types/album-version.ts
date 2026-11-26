import type { ArtworkInput } from '#lib/artworks/types/artwork-input.ts';
import type { AlbumEntryRef } from './album-entry-ref.ts';

export type AlbumVersion = AlbumEntryRef & {
	albumTitle: string;
	revision: number;
	wikidataId: string | null;
	artwork: ArtworkInput;
	newValues: string[];
};
