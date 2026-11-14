import { collectionErrorMessage } from '#lib/catalogue/errors/errors.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import type { ArtworkRelationMatch } from '#lib/artwork-relations/types/artwork-relation-match.ts';

type SuggestionRow = {
	kind: string;
	id: string;
	record_number: number | null;
	title: string;
	authors: string[] | null;
};

type SearchResult = { artworks: ArtworkRelationMatch[]; error?: string };

export async function searchRelatedArtworks(
	phrase: string,
	excluded: readonly string[],
	signal?: AbortSignal
): Promise<SearchResult> {
	const request = supabase.rpc('note_link_suggestions', {
		link_trigger: '#',
		phrase,
		excluded: [...excluded]
	});
	const { data, error } = await (signal ? request.abortSignal(signal) : request);
	if (error) return { artworks: [], error: collectionErrorMessage(error) };
	return {
		artworks: (data as SuggestionRow[]).flatMap((row) =>
			row.kind === 'artwork' && row.record_number !== null
				? [{ id: row.id, number: row.record_number, title: row.title, authors: row.authors ?? [] }]
				: []
		)
	};
}
