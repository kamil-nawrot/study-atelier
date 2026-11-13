import { collectionErrorMessage } from '#lib/catalogue/errors/errors.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { authorRelationTypeOf } from '#lib/author-relations/author-relation-types/author-relation-types.ts';
import type { AuthorRelation } from '#lib/author-relations/types/author-relation.ts';

type RelationRow = {
	kind: string;
	from: { id: string; name: string } | null;
	to: { id: string; name: string } | null;
};

type LoadResult = { relations: AuthorRelation[]; error?: string };

const COLUMNS =
	'kind, from:category_values!author_relations_from_id_owner_id_category_code_fkey(id, name), to:category_values!author_relations_to_id_owner_id_category_code_fkey(id, name)';

export function authorRelationsFromRows(
	authorId: string,
	rows: readonly RelationRow[]
): AuthorRelation[] {
	return rows.flatMap(({ kind, from, to }) => {
		const side = from?.id === authorId ? 'from' : 'to';
		const other = side === 'from' ? to : from;
		const type = authorRelationTypeOf(kind, side);
		return type && other ? [{ type, author: { id: other.id, name: other.name } }] : [];
	});
}

export async function loadAuthorRelations(authorId: string): Promise<LoadResult> {
	const { data, error } = await supabase
		.from('author_relations')
		.select(COLUMNS)
		.or(`from_id.eq.${authorId},to_id.eq.${authorId}`);
	if (error) return { relations: [], error: collectionErrorMessage(error) };
	return { relations: authorRelationsFromRows(authorId, data ?? []) };
}
