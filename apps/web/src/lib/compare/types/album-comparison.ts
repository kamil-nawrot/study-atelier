import type { AlbumVersion } from '#lib/albums/types/album-version.ts';
import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';

export type AlbumComparison = {
	mine?: ArtworkRecord;
	version?: AlbumVersion;
	error?: string;
};
