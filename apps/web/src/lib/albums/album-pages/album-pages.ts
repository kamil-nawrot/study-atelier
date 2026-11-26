import { dev } from '$app/env';
import { loadAlbum, loadAlbumListings } from '#lib/albums/album-files/album-files.ts';
import { loadAtelierMatches } from '#lib/albums/album-matches-data/album-matches-data.ts';
import { galleryQuery, listQuery, ownedCount } from '#lib/albums/album-matching/album-matching.ts';
import { locale, m } from '#lib/i18n/i18n.ts';
import type { Album } from '#lib/albums/types/album.ts';
import type { AtelierMatch } from '#lib/albums/types/atelier-match.ts';
import type { ListedAlbum } from '#lib/albums/types/listed-album.ts';

type Fetch = typeof fetch;

export async function loadAlbumList(
	fetcher: Fetch,
	withSamples: boolean = dev
): Promise<{ albums: ListedAlbum[]; error?: string }> {
	const listings = await loadAlbumListings(locale, withSamples, fetcher);
	if (!listings) return { albums: [], error: m.albums.loadError };
	const loaded = await Promise.all(
		listings.map((listing) => loadAlbum(listing.slug, locale, fetcher))
	);
	const albums = loaded.filter((album): album is Album => album !== undefined);
	if (albums.length === 0) return { albums: [] };
	const { matches, error } = await loadAtelierMatches(listQuery(albums));
	return {
		albums: albums.map((album) => ({ album, owned: ownedCount(album, matches) })),
		error
	};
}

export async function loadAlbumGallery(
	slug: string,
	fetcher: Fetch,
	withSamples: boolean = dev
): Promise<{ album?: Album; matches: AtelierMatch[]; notFound?: boolean; error?: string }> {
	const listings = await loadAlbumListings(locale, withSamples, fetcher);
	if (!listings) return { matches: [], error: m.albums.loadError };
	if (!listings.some((listing) => listing.slug === slug)) return { matches: [], notFound: true };
	const album = await loadAlbum(slug, locale, fetcher);
	if (!album) return { matches: [], error: m.albums.loadError };
	const { matches, error } = await loadAtelierMatches(galleryQuery(album));
	return { album, matches, error };
}
