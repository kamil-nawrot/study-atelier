import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import { loadCardIndex } from '#lib/card-index/card-index-data/card-index-data.ts';
import { valuesOf } from '#lib/card-index/artwork-values/artwork-values.ts';
import { buildNoteLinks, labelledNoteLinks } from '#lib/notes/note-links/note-links.ts';
import { noteLinkArgs } from '#lib/notes/note-link-target/note-link-target.ts';
import { formatRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
import { isEraCode } from '#lib/catalogue/eras/eras.ts';
import { isValueKind, valuePath } from '#lib/card-index/value-pages/value-pages.ts';
import { m } from '#lib/i18n/i18n.ts';
import { resolve } from '$app/paths';
import type { NoteLinkSource } from '#lib/notes/types/note-link-source.ts';
import type { NoteLinkArtwork } from '#lib/notes/types/note-link-artwork.ts';
import type { ArtworkValueRow } from '#lib/card-index/types/artwork-value-row.ts';
import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
import type { NoteLinks } from '@study-atelier/ui';

type NoteLinkRow = {
	record_number: number;
	title: string;
	artwork_values: ArtworkValueRow[];
};

type NoteLinkLabelRow = {
	kind: string;
	id: string;
	record_number: number | null;
	title: string | null;
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

function labelOf(row: NoteLinkLabelRow): [string, string] | undefined {
	if (row.kind === 'artwork' && row.record_number !== null) {
		return [
			resolve('/(app)/atelier/[number]', { number: String(row.record_number) }),
			`${formatRecordNumber(row.record_number)} ${row.title ?? ''}`
		];
	}
	if (row.kind === 'era')
		return isEraCode(row.id) ? [valuePath('era', row.id), m.eras[row.id].name] : undefined;
	return isValueKind(row.kind) ? [valuePath(row.kind, row.id), row.title ?? ''] : undefined;
}

export async function loadNoteLinkLabels(source: NoteLinkSource): Promise<NoteLinks | undefined> {
	const { rows, error } = await fetchAll<NoteLinkLabelRow>((from, to) =>
		supabase.rpc('note_link_labels', noteLinkArgs(source)).range(from, to)
	);
	if (error) return undefined;
	const labels = rows.map(labelOf).filter((label) => label !== undefined);
	return labelledNoteLinks(new Map(labels));
}
