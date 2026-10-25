import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import { loadCardIndex } from '#lib/card-index/card-index-data/card-index-data.ts';
import { valuesOf } from '#lib/card-index/artwork-values/artwork-values.ts';
import { buildNoteLinks } from '#lib/notes/note-links/note-links.ts';
import type { NoteLinkArtwork } from '#lib/notes/types/note-link-artwork.ts';
import type { ArtworkValueRow } from '#lib/card-index/types/artwork-value-row.ts';
import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
import type { NoteLinks } from '@study-atelier/ui';

type NoteLinkRow = {
	record_number: number;
	title: string;
	artwork_values: ArtworkValueRow[];
};

const NOTE_LINK_MARKER = '](/atelier/';

export function mentionsLinks(notes: string | null | undefined): boolean {
	return Boolean(notes?.includes(NOTE_LINK_MARKER));
}

async function loadNoteLinkArtworks(): Promise<NoteLinkArtwork[] | undefined> {
	const { rows, error } = await fetchAll<NoteLinkRow>((from, to) =>
		supabase
			.from('artworks')
			.select(
				'record_number, title, artwork_values(position, category_values(category_code, name))'
			)
			.is('deleted_at', null)
			.order('record_number', { ascending: false })
			.range(from, to)
	);
	if (error) return undefined;
	return rows.map((row) => ({
		number: row.record_number,
		title: row.title,
		authors: valuesOf(row.artwork_values, 'author')
	}));
}

export async function loadNoteLinks(): Promise<NoteLinks | undefined> {
	const [cardIndex, artworks] = await Promise.all([loadCardIndex(), loadNoteLinkArtworks()]);
	if (cardIndex.error || !artworks) return undefined;
	return buildNoteLinks({ index: cardIndex.index, artworks });
}

export function noteLinksFrom(index: CardIndexData, artworks: NoteLinkArtwork[]): NoteLinks {
	return buildNoteLinks({ index, artworks });
}
