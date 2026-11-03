import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import {
	editorNoteLinks,
	labelledNoteLinks,
	suggestionOption,
	withEras
} from '#lib/notes/note-links/note-links.ts';
import { noteLinkArgs } from '#lib/notes/note-link-target/note-link-target.ts';
import { formatRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
import { isEraCode } from '#lib/catalogue/eras/eras.ts';
import { isValueKind, valuePath } from '#lib/card-index/value-pages/value-pages.ts';
import { m } from '#lib/i18n/i18n.ts';
import { resolve } from '$app/paths';
import type { NoteLinkSource } from '#lib/notes/types/note-link-source.ts';
import type { NoteLinkSuggestionRow } from '#lib/notes/types/note-link-suggestion-row.ts';
import type { NoteLinkOption, NoteLinks, NoteLinkTrigger } from '@study-atelier/ui';

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

async function loadLabels(source: NoteLinkSource): Promise<Map<string, string> | undefined> {
	const { rows, error } = await fetchAll<NoteLinkLabelRow>((from, to) =>
		supabase.rpc('note_link_labels', noteLinkArgs(source)).range(from, to)
	);
	if (error) return undefined;
	return new Map(rows.map(labelOf).filter((label) => label !== undefined));
}

export async function loadNoteLinkLabels(source: NoteLinkSource): Promise<NoteLinks | undefined> {
	const labels = await loadLabels(source);
	return labels && labelledNoteLinks(labels);
}

async function searchNoteLinks(
	trigger: NoteLinkTrigger,
	phrase: string
): Promise<NoteLinkOption[]> {
	const { data, error } = await supabase.rpc('note_link_suggestions', {
		link_trigger: trigger,
		phrase
	});
	const options = error
		? []
		: (data as NoteLinkSuggestionRow[])
				.map(suggestionOption)
				.filter((option) => option !== undefined);
	return trigger === '@' ? withEras(phrase, options) : options;
}

export async function loadEditorNoteLinks(source?: NoteLinkSource): Promise<NoteLinks> {
	const labels = source && (await loadLabels(source));
	return editorNoteLinks(searchNoteLinks, labels);
}
