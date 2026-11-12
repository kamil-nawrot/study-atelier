import {
	groupRelations,
	relationTypeOf
} from '#lib/artwork-relations/relation-types/relation-types.ts';
import type { ArtworkRelation } from '#lib/artwork-relations/types/artwork-relation.ts';
import type { ArtworkRelationEntry } from '#lib/artwork-relations/types/artwork-relation-entry.ts';
import type { ArtworkRelationRow } from '#lib/artwork-relations/types/artwork-relation-row.ts';
import type { RelationSide } from '#lib/artwork-relations/types/relation-side.ts';

export type RelationRow = {
	kind: string;
	artwork: { id: string; record_number: number; title: string; deleted_at: string | null } | null;
};

const OTHER_COLUMNS = 'id, record_number, title, deleted_at';

export const RELATION_COLUMNS = [
	`outgoing_relations:artwork_relations!artwork_relations_from_id_owner_id_fkey(kind, artwork:artworks!artwork_relations_to_id_owner_id_fkey(${OTHER_COLUMNS}))`,
	`incoming_relations:artwork_relations!artwork_relations_to_id_owner_id_fkey(kind, artwork:artworks!artwork_relations_from_id_owner_id_fkey(${OTHER_COLUMNS}))`
];

function relationsOn(
	rows: readonly RelationRow[] | undefined,
	side: RelationSide
): ArtworkRelation[] {
	return (rows ?? []).flatMap(({ kind, artwork }) => {
		const type = relationTypeOf(kind, side);
		if (!type || !artwork || artwork.deleted_at !== null) return [];
		return [
			{ type, artwork: { id: artwork.id, number: artwork.record_number, title: artwork.title } }
		];
	});
}

export function relationsFromRows(
	outgoing: readonly RelationRow[] | undefined,
	incoming: readonly RelationRow[] | undefined
): ArtworkRelation[] {
	return [...relationsOn(outgoing, 'from'), ...relationsOn(incoming, 'to')];
}

export function relationRowsOf(relations: readonly ArtworkRelation[]): ArtworkRelationRow[] {
	return groupRelations(relations).flatMap(({ type, artworks }) =>
		artworks.map((artwork) => ({ key: artwork.id, type, artwork: { ...artwork } }))
	);
}

export function relationEntriesOf(rows: readonly ArtworkRelationRow[]): ArtworkRelationEntry[] {
	return rows.map(({ type, artwork }) => ({
		type: type === '' ? null : type,
		artwork: artwork && { ...artwork }
	}));
}

export function emptyRelationRow(key: string = crypto.randomUUID()): ArtworkRelationRow {
	return { key, type: '', artwork: null };
}
