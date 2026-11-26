import { loadAlbum } from '#lib/albums/album-files/album-files.ts';
import { loadLearnerValues } from '#lib/albums/album-values-data/album-values-data.ts';
import { albumVersion } from '#lib/albums/album-version/album-version.ts';
import type { Album } from '#lib/albums/types/album.ts';
import type { AlbumArtwork } from '#lib/albums/types/album-artwork.ts';
import type { AlbumEntryRef } from '#lib/albums/types/album-entry-ref.ts';
import type { AlbumVersion } from '#lib/albums/types/album-version.ts';
import { locale } from '#lib/i18n/i18n.ts';

type AlbumVersionResult = { version?: AlbumVersion; error?: string };

export async function loadArtworkVersion(
	album: Album,
	artwork: AlbumArtwork
): Promise<AlbumVersionResult> {
	const ids = new Set(artwork.valueIds);
	const learner = await loadLearnerValues(album.values.filter((value) => ids.has(value.id)));
	if (learner.error) return { error: learner.error };
	return { version: albumVersion(album, artwork, learner.values) };
}

export async function loadAlbumVersion(
	entry: AlbumEntryRef,
	fetcher: typeof fetch = fetch
): Promise<AlbumVersionResult> {
	const album = await loadAlbum(entry.slug, locale, fetcher);
	const artwork = album?.artworks.find((candidate) => candidate.id === entry.entryId);
	if (!album || !artwork) return {};
	return loadArtworkVersion(album, artwork);
}
