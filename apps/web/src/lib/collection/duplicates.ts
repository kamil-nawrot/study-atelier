import { locale } from '#lib/i18n/index.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { formatRecordNumber } from './format.ts';
import type { ArtworkInput } from './types.ts';
import { valueKey } from './value-suggestions.ts';

export type TitleAndAuthors = Pick<ArtworkInput, 'title' | 'authors'>;

export type DuplicateCandidate = TitleAndAuthors & {
	id: string;
	number: number;
};

type CandidateRow = {
	id: string;
	record_number: number;
	title: string;
	artwork_values: { category_values: { category_code: string; name: string } | null }[];
};

function authorKeys(authors: readonly string[]): string[] {
	return [...new Set(authors.map(valueKey))].sort();
}

export function sameTitleAndAuthors(a: TitleAndAuthors, b: TitleAndAuthors): boolean {
	if (valueKey(a.title) !== valueKey(b.title)) return false;
	const left = authorKeys(a.authors);
	const right = authorKeys(b.authors);
	return left.length === right.length && left.every((key, index) => key === right[index]);
}

export function duplicateNumbers(
	artwork: TitleAndAuthors,
	candidates: readonly DuplicateCandidate[],
	excludeId?: string
): number[] {
	return candidates
		.filter((candidate) => candidate.id !== excludeId && sameTitleAndAuthors(artwork, candidate))
		.map((candidate) => candidate.number)
		.sort((a, b) => a - b);
}

export function formatRecordNumbers(numbers: readonly number[]): string {
	return new Intl.ListFormat(locale, { type: 'conjunction' }).format(
		numbers.map(formatRecordNumber)
	);
}

function candidateFromRow(row: CandidateRow): DuplicateCandidate {
	return {
		id: row.id,
		number: row.record_number,
		title: row.title,
		authors: row.artwork_values
			.filter((value) => value.category_values?.category_code === 'author')
			.map((value) => value.category_values?.name ?? '')
	};
}

export async function findDuplicates(
	artwork: TitleAndAuthors,
	excludeId?: string
): Promise<number[]> {
	const { data, error } = await supabase
		.from('artworks')
		.select('id, record_number, title, artwork_values(category_values(category_code, name))')
		.is('deleted_at', null);
	if (error) return [];
	const candidates = ((data ?? []) as unknown as CandidateRow[]).map(candidateFromRow);
	return duplicateNumbers(artwork, candidates, excludeId);
}
