import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import type { ReviewRelations } from '#lib/review/types/review-relations.ts';

type AuthorRow = {
	kind: string;
	from: { name: string } | null;
	to: { name: string } | null;
};

const AUTHOR_COLUMNS =
	'kind, from:category_values!author_relations_from_id_owner_id_category_code_fkey(name), to:category_values!author_relations_to_id_owner_id_category_code_fkey(name)';

const NONE: ReviewRelations = { artworks: [], authors: [] };

export async function loadReviewRelations(): Promise<ReviewRelations> {
	const [artworks, authors] = await Promise.all([
		supabase.from('artwork_relations').select('kind, from_id, to_id').neq('kind', 'related'),
		supabase.from('author_relations').select(AUTHOR_COLUMNS).neq('kind', 'related')
	]);
	if (artworks.error || authors.error) return NONE;
	return {
		artworks: (artworks.data ?? []).map((row) => ({
			kind: row.kind,
			from: row.from_id,
			to: row.to_id
		})),
		authors: ((authors.data ?? []) as AuthorRow[]).flatMap(({ kind, from, to }) =>
			from && to ? [{ kind, from: from.name, to: to.name }] : []
		)
	};
}
