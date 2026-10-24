import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import {
	type TitleAndAuthors,
	type DuplicateCandidate,
	duplicateNumbers
} from '#lib/artworks/duplicates/duplicates.ts';

type CandidateRow = {
	id: string;
	record_number: number;
	title: string;
	artwork_values: { category_values: { category_code: string; name: string } | null }[];
};

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
