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

type MentionRow = {
	kind: string;
	id: string;
	record_number: number | null;
	title: string | null;
	notes: string;
};

export type NotesMatcher = {
	like?: string;
	test: (notes: string) => boolean;
};

function artworkMentions(rows: MentionRow[], own: string): Mention[] {
	return rows
		.flatMap(({ record_number: number, title }) =>
			number === null
				? []
				: [
						{
							href: resolve('/(app)/atelier/[number]', { number: String(number) }),
							name: `${formatRecordNumber(number)} ${title ?? ''}`,
							kind: m.mentions.artwork
						}
					]
		)
		.filter((mention) => mention.href !== own);
}

async function valueMentions(
	rows: MentionRow[],
	own: string,
	index: CardIndexData | undefined
): Promise<Mention[]> {
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

export async function loadNotesMentions(
	matcher: NotesMatcher,
	own: string,
	index?: CardIndexData
): Promise<Mention[]> {
	const { rows, error } = await fetchAll<MentionRow>((from, to) =>
		supabase
			.rpc('notes_mentions', matcher.like === undefined ? {} : { needle: matcher.like })
			.range(from, to)
	);
	if (error) return [];
	const found = rows.filter((row) => matcher.test(row.notes));
	const values = await valueMentions(
		found.filter((row) => row.kind !== 'artwork'),
		own,
		index
	);
	return [
		...values,
		...artworkMentions(
			found.filter((row) => row.kind === 'artwork'),
			own
		)
	];
}

export async function loadMentions(
	path: ResolvedPathname,
	index?: CardIndexData
): Promise<Mention[]> {
	const needle = `](${path})`;
	return loadNotesMentions({ like: needle, test: (notes) => notes.includes(needle) }, path, index);
}
