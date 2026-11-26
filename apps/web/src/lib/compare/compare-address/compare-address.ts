import { resolve } from '$app/paths';
import type { ResolvedPathname } from '$app/types';
import { albumEntryKey, parseAlbumEntry } from '#lib/albums/album-entry/album-entry.ts';
import type { AlbumEntryRef } from '#lib/albums/types/album-entry-ref.ts';
import { parseRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
import type { CompareSides } from '#lib/compare/types/compare-sides.ts';

const LEFT = 'left';
const RIGHT = 'right';
const ALBUM = 'album';

function numberOf(params: URLSearchParams, key: string): number | null {
	const text = params.get(key);
	return text === null ? null : parseRecordNumber(text);
}

export function sidesOf(params: URLSearchParams): CompareSides {
	return { left: numberOf(params, LEFT), right: numberOf(params, RIGHT) };
}

export function compareHref(sides: CompareSides): ResolvedPathname {
	const params = new URLSearchParams();
	if (sides.left !== null) params.set(LEFT, String(sides.left));
	if (sides.right !== null) params.set(RIGHT, String(sides.right));
	const query = params.toString();
	const path = resolve('/(app)/atelier/compare');
	return query === '' ? path : (`${path}?${query}` as ResolvedPathname);
}

export function swapped(sides: CompareSides): CompareSides {
	return { left: sides.right, right: sides.left };
}

export function albumEntryOf(params: URLSearchParams): AlbumEntryRef | null {
	return parseAlbumEntry(params.get(ALBUM));
}

export function compareAlbumHref(number: number, entry: AlbumEntryRef): ResolvedPathname {
	const params = new URLSearchParams({ [LEFT]: String(number), [ALBUM]: albumEntryKey(entry) });
	return `${resolve('/(app)/atelier/compare')}?${params.toString()}` as ResolvedPathname;
}
