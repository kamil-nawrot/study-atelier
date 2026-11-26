import { resolve } from '$app/paths';
import type { ResolvedPathname } from '$app/types';
import type { Album } from '#lib/albums/types/album.ts';
import type { AlbumArtwork } from '#lib/albums/types/album-artwork.ts';
import type { AlbumArtworkState } from '#lib/albums/types/album-artwork-state.ts';
import type { AtelierMatch } from '#lib/albums/types/atelier-match.ts';
import type { AtelierMatchQuery } from '#lib/albums/types/atelier-match-query.ts';

export function albumEntry(slug: string, entryId: string): string {
	return `${slug}/${entryId}`;
}

function wikidataIdsOf(albums: Album[]): string[] {
	const ids = albums.flatMap((album) =>
		album.artworks.flatMap((artwork) => (artwork.wikidataId ? [artwork.wikidataId] : []))
	);
	return [...new Set(ids)];
}

export function listQuery(albums: Album[]): AtelierMatchQuery {
	return {
		slugs: albums.map((album) => album.slug),
		wikidataIds: wikidataIdsOf(albums),
		titles: []
	};
}

export function galleryQuery(album: Album): AtelierMatchQuery {
	return {
		slugs: [album.slug],
		wikidataIds: wikidataIdsOf([album]),
		titles: [...new Set(album.artworks.map((artwork) => artwork.title))]
	};
}

function sameTitle(a: string, b: string): boolean {
	return a.trim().toLocaleLowerCase('pl') === b.trim().toLocaleLowerCase('pl');
}

function takenMatch(
	slug: string,
	artwork: AlbumArtwork,
	matches: AtelierMatch[]
): AtelierMatch | undefined {
	const entry = albumEntry(slug, artwork.id);
	return (
		matches.find((match) => match.albumEntry === entry) ??
		(artwork.wikidataId
			? matches.find((match) => match.wikidataIds.includes(artwork.wikidataId as string))
			: undefined)
	);
}

export function artworkState(
	slug: string,
	artwork: AlbumArtwork,
	matches: AtelierMatch[]
): AlbumArtworkState {
	const taken = takenMatch(slug, artwork, matches);
	if (taken) return { kind: 'owned', number: taken.number };
	const similar = matches.find((match) => sameTitle(match.title, artwork.title));
	return similar ? { kind: 'similar', number: similar.number } : { kind: 'new' };
}

export function ownedCount(album: Album, matches: AtelierMatch[]): number {
	return album.artworks.filter((artwork) => takenMatch(album.slug, artwork, matches)).length;
}

export function compareWithAlbumHref(
	number: number,
	slug: string,
	entryId: string
): ResolvedPathname {
	const params = new URLSearchParams({ left: String(number), album: albumEntry(slug, entryId) });
	return `${resolve('/(app)/atelier/compare')}?${params}` as ResolvedPathname;
}
