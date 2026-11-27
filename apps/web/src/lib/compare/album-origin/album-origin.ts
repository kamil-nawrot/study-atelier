import { resolve } from '$app/paths';
import { parseAlbumEntry } from '#lib/albums/album-entry/album-entry.ts';
import { loadAlbum } from '#lib/albums/album-files/album-files.ts';
import type { AlbumLink } from '#lib/artworks/types/album-link.ts';
import type { ArtworkOrigin } from '#lib/artworks/types/artwork-origin.ts';
import { compareAlbumHref } from '#lib/compare/compare-address/compare-address.ts';
import { locale } from '#lib/i18n/i18n.ts';

export async function loadAlbumOrigin(
	link: AlbumLink | undefined,
	number: number,
	fetcher: typeof fetch = fetch
): Promise<ArtworkOrigin | undefined> {
	const entry = parseAlbumEntry(link?.entry ?? null);
	if (!link || !entry) return undefined;
	const album = await loadAlbum(entry.slug, locale, fetcher);
	if (!album) return undefined;
	const artwork = album.artworks.find((candidate) => candidate.id === entry.entryId);
	return {
		albumTitle: album.title,
		albumHref: resolve('/(app)/atelier/albums/[slug]', { slug: entry.slug }),
		...(artwork && artwork.revision > link.revision
			? { newerHref: compareAlbumHref(number, entry) }
			: {})
	};
}
