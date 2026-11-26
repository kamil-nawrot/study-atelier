import { ERA_CODES } from '#lib/catalogue/eras/eras.ts';
import { formatDate } from '#lib/catalogue/years/years.ts';
import type { Album } from '#lib/albums/types/album.ts';
import type { AlbumArtwork } from '#lib/albums/types/album-artwork.ts';
import type { AlbumImage } from '#lib/albums/types/album-image.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { ListedAlbum } from '#lib/albums/types/listed-album.ts';

export const COVER_IMAGES = 4;

export function albumCounts(album: Album): { artworks: number; terms: number; events: number } {
	return {
		artworks: album.artworks.length,
		terms: album.terms.length,
		events: album.events.length
	};
}

export function coverImages(album: Album): AlbumImage[] {
	return album.artworks.slice(0, COVER_IMAGES).map((artwork) => artwork.images[0]);
}

export function authorNames(album: Album, artwork: AlbumArtwork): string[] {
	return album.values
		.filter((value) => value.category === 'author' && artwork.valueIds.includes(value.id))
		.map((value) => value.name);
}

export function artworkDate(artwork: AlbumArtwork): string | undefined {
	return formatDate(artwork.yearFrom, artwork.yearTo, artwork.yearApproximate);
}

export function albumsByEra(albums: ListedAlbum[]): { code: EraCode; albums: ListedAlbum[] }[] {
	return ERA_CODES.map((code) => ({
		code,
		albums: albums
			.filter((listed) => listed.album.eraCode === code)
			.sort((a, b) => a.album.title.localeCompare(b.album.title, 'pl'))
	})).filter((era) => era.albums.length > 0);
}
