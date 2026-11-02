import type { ResolvedPathname } from '$app/types';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import { loadCardIndex } from '#lib/card-index/card-index-data/card-index-data.ts';
import { formatRecordNumber } from '#lib/catalogue/record-number/record-number.ts';
import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
import type { CardIndexData } from '#lib/catalogue/types/card-index-data.ts';
import {
	findSubject,
	isValueKind,
	subjectName,
	subjectPath,
	valueKindName,
	valuePath
} from '#lib/card-index/value-pages/value-pages.ts';
import { isEraCode } from '#lib/catalogue/eras/eras.ts';
import { m } from '#lib/i18n/i18n.ts';
import { resolve } from '$app/paths';
import type { Mention } from '#lib/notes/types/mention.ts';

type MentionRow = {
	kind: string;
	id: string;
	record_number: number | null;
	title: string | null;
	notes: string;
};

type NotesMatcher = {
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

function visitMentions(rows: MentionRow[]): Mention[] {
	return rows.map(({ id, title }) => ({
		href: resolve('/(app)/atelier/chronicle/[id]', { id }),
		name: title ?? '',
		kind: m.mentions.visit
	}));
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
		.sort(byName);
}

function byName(a: Mention, b: Mention): number {
	return normalizeForSearch(a.name).localeCompare(normalizeForSearch(b.name), 'pl');
}

function namedValueMentions(rows: MentionRow[]): Mention[] {
	return rows
		.flatMap(({ kind, id, title }) => {
			if (!isValueKind(kind)) return [];
			if (kind === 'era') {
				return isEraCode(id)
					? [{ href: valuePath(kind, id), name: m.eras[id].name, kind: valueKindName(kind) }]
					: [];
			}
			return [{ href: valuePath(kind, id), name: title ?? '', kind: valueKindName(kind) }];
		})
		.sort(byName);
}

function isValueRow(row: MentionRow): boolean {
	return row.kind !== 'artwork' && row.kind !== 'visit';
}

function withArtworksAndVisits(values: Mention[], found: MentionRow[], own: string): Mention[] {
	return [
		...values,
		...artworkMentions(
			found.filter((row) => row.kind === 'artwork'),
			own
		),
		...visitMentions(found.filter((row) => row.kind === 'visit'))
	];
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
	const values = await valueMentions(found.filter(isValueRow), own, index);
	return withArtworksAndVisits(values, found, own);
}

export async function loadTermMentions(
	phrases: string[],
	test: (notes: string) => boolean
): Promise<Mention[]> {
	const { rows, error } = await fetchAll<MentionRow>((from, to) =>
		supabase.rpc('term_mentions', { needles: phrases }).range(from, to)
	);
	if (error) return [];
	const found = rows.filter((row) => test(row.notes));
	return withArtworksAndVisits(namedValueMentions(found.filter(isValueRow)), found, '');
}

export async function loadMentions(
	path: ResolvedPathname,
	index?: CardIndexData
): Promise<Mention[]> {
	const needle = `](${path})`;
	return loadNotesMentions({ like: needle, test: (notes) => notes.includes(needle) }, path, index);
}
