import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';

export type ComparedArtworks = {
	left?: ArtworkRecord;
	right?: ArtworkRecord;
	error?: string;
};
