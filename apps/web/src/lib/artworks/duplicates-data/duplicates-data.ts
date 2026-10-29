import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { duplicateNumbers } from '#lib/artworks/duplicates/duplicates.ts';
import type { TitleAndAuthors } from '#lib/artworks/types/title-and-authors.ts';
import type { DuplicateCandidate } from '#lib/artworks/types/duplicate-candidate.ts';

type CandidateRow = {
	id: string;
	record_number: number;
	title: string;
	authors: string[];
};

function candidateFromRow(row: CandidateRow): DuplicateCandidate {
	return {
		id: row.id,
		number: row.record_number,
		title: row.title,
		authors: row.authors
	};
}

export async function findDuplicates(
	artwork: TitleAndAuthors,
	excludeId?: string
): Promise<number[]> {
	const { data, error } = await supabase.rpc('duplicate_candidates', { title: artwork.title });
	if (error) return [];
	const candidates = ((data ?? []) as CandidateRow[]).map(candidateFromRow);
	return duplicateNumbers(artwork, candidates, excludeId);
}
