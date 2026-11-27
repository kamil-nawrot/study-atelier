import type { Album } from '#lib/albums/types/album.ts';
import type { AlbumArtwork } from '#lib/albums/types/album-artwork.ts';

export type AlbumWalkData = {
	album?: Album;
	artworks: AlbumArtwork[];
	similar?: Record<string, number>;
	notFound?: boolean;
	error?: string;
};
