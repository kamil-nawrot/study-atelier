import type { ResolvedPathname } from '$app/types';
import { supabase } from '#lib/supabase.ts';
import { fetchAll, loadCardIndex } from './card-index-data.ts';
import { formatRecordNumber } from './format.ts';
import { normalizeForSearch } from './search.ts';
import type { CardIndexData } from './types.ts';
import { findSubject, subjectName, subjectPath, valueKindName } from './value-pages.ts';
import { m } from '#lib/i18n/index.ts';
import { resolve } from '$app/paths';

export type Mention = {
	href: ResolvedPathname;
	name: string;
	kind: string;
};

type ArtworkNotesRow = { record_number: number; title: string; notes: string | null };

type DetailsNotesRow = { notes: string | null; value_id?: string; era_code?: string };

const DETAILS_TABLES = [
	{ table: 'era_details', kind: 'era', column: 'era_code' },
	{ table: 'period_details', kind: 'period', column: 'value_id' },
	{ table: 'style_details', kind: 'style', column: 'value_id' },
	{ table: 'material_details', kind: 'material', column: 'value_id' },
	{ table: 'author_details', kind: 'author', column: 'value_id' },
	{ table: 'location_details', kind: 'location', column: 'value_id' }
] as const;

function mentions(notes: string | null, needle: string): boolean {
	return notes?.includes(needle) ?? false;
}

async function artworkMentions(needle: string, own: string): Promise<Mention[]> {
	const { rows, error } = await fetchAll<ArtworkNotesRow>((from, to) =>
		supabase
			.from('artworks')
			.select('record_number, title, notes')
			.is('deleted_at', null)
			.like('notes', `%${needle}%`)
			.order('record_number', { ascending: true })
			.range(from, to)
	);
	if (error) return [];
	return rows
		.filter((row) => mentions(row.notes, needle))
		.map((row) => ({
			href: resolve('/(app)/atelier/[number]', { number: String(row.record_number) }),
			name: `${formatRecordNumber(row.record_number)} ${row.title}`,
			kind: m.mentions.artwork
		}))
		.filter((mention) => mention.href !== own);
}

async function valueMentions(
	needle: string,
	own: string,
	index: CardIndexData | undefined
): Promise<Mention[]> {
	const found = await Promise.all(
		DETAILS_TABLES.map(async ({ table, kind, column }) => {
			const { data, error } = await supabase
				.from(table)
				.select(`${column}, notes`)
				.like('notes', `%${needle}%`);
			if (error) return [];
			return ((data ?? []) as unknown as DetailsNotesRow[])
				.filter((row) => mentions(row.notes, needle))
				.map((row) => ({ kind, id: (row[column] ?? '') as string }));
		})
	);
	const rows = found.flat();
	if (rows.length === 0) return [];

	const known = index ?? (await loadCardIndex()).index;
	return rows
		.flatMap(({ kind, id }) => {
			const subject = findSubject(known, kind, id);
			return subject
				? [
						{
							href: subjectPath(subject),
							name: subjectName(subject),
							kind: valueKindName(subject.kind)
						}
					]
				: [];
		})
		.filter((mention) => mention.href !== own)
		.sort((a, b) => normalizeForSearch(a.name).localeCompare(normalizeForSearch(b.name), 'pl'));
}

export async function loadMentions(
	path: ResolvedPathname,
	index?: CardIndexData
): Promise<Mention[]> {
	const needle = `](${path})`;
	const [values, artworks] = await Promise.all([
		valueMentions(needle, path, index),
		artworkMentions(needle, path)
	]);
	return [...values, ...artworks];
}
