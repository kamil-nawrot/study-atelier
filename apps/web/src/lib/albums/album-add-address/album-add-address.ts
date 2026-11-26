import { resolve } from '$app/paths';
import type { ResolvedPathname } from '$app/types';
import { ENTRY_ID } from '#lib/albums/album-reader/album-reader.ts';
import type { Album } from '#lib/albums/types/album.ts';
import type { AlbumArtwork } from '#lib/albums/types/album-artwork.ts';

const ENTRIES = 'entries';

export function albumAddHref(slug: string, entryIds: readonly string[]): ResolvedPathname {
	const params = new URLSearchParams({ [ENTRIES]: entryIds.join(',') });
	return `${resolve('/(app)/atelier/albums/[slug]/add', { slug })}?${params.toString()}` as ResolvedPathname;
}

export function entryIdsOf(params: URLSearchParams): string[] {
	return (params.get(ENTRIES) ?? '').split(',').filter((id) => ENTRY_ID.test(id));
}

export function artworksToAdd(album: Album, entryIds: readonly string[]): AlbumArtwork[] {
	const wanted = new Set(entryIds);
	return album.artworks.filter((artwork) => wanted.has(artwork.id));
}
