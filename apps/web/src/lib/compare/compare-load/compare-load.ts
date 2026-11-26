import { loadAlbumVersion } from '#lib/albums/album-version-load/album-version-load.ts';
import type { AlbumEntryRef } from '#lib/albums/types/album-entry-ref.ts';
import { artworkCore } from '#lib/artworks/artwork-preload/artwork-preload.ts';
import type { ArtworkRecord } from '#lib/artworks/types/artwork-record.ts';
import type { CompareSides } from '#lib/compare/types/compare-sides.ts';
import type { ComparedArtworks } from '#lib/compare/types/compared-artworks.ts';
import type { AlbumComparison } from '#lib/compare/types/album-comparison.ts';
import { m } from '#lib/i18n/i18n.ts';

async function artworkAt(
	number: number | null
): Promise<{ artwork?: ArtworkRecord; error?: string }> {
	if (number === null) return {};
	const result = await artworkCore(number);
	if (result.artwork) return { artwork: result.artwork };
	return result.notFound ? {} : { error: result.error };
}

export async function loadComparison(sides: CompareSides): Promise<ComparedArtworks> {
	const [left, right] = await Promise.all([artworkAt(sides.left), artworkAt(sides.right)]);
	return {
		left: left.artwork,
		right: right.artwork,
		error: left.error ?? right.error
	};
}

export async function loadAlbumComparison(
	number: number | null,
	entry: AlbumEntryRef,
	fetcher: typeof fetch = fetch
): Promise<AlbumComparison> {
	const [mine, album] = await Promise.all([artworkAt(number), loadAlbumVersion(entry, fetcher)]);
	const error = mine.error ?? album.error;
	if (error) return { error };
	if (!mine.artwork) return { error: m.artworkErrors.notFound };
	if (!album.version) return { error: m.compare.albumEntryMissing };
	return { mine: mine.artwork, version: album.version };
}
