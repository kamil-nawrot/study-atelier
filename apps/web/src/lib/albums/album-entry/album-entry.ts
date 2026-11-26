import { ENTRY_ID } from '#lib/albums/album-reader/album-reader.ts';
import type { AlbumEntryRef } from '#lib/albums/types/album-entry-ref.ts';

export function albumEntryKey(entry: AlbumEntryRef): string {
	return `${entry.slug}/${entry.entryId}`;
}

export function parseAlbumEntry(key: string | null): AlbumEntryRef | null {
	if (key === null) return null;
	const [slug, entryId, ...rest] = key.split('/');
	if (rest.length > 0 || !ENTRY_ID.test(slug ?? '') || !ENTRY_ID.test(entryId ?? '')) return null;
	return { slug, entryId };
}
