import type { SelectOption } from '@study-atelier/ui';
import { m } from '#lib/i18n/i18n.ts';
import type { ArtworkRelation } from '#lib/artwork-relations/types/artwork-relation.ts';
import type { ArtworkRelationEntry } from '#lib/artwork-relations/types/artwork-relation-entry.ts';
import type { ArtworkRelationGroup } from '#lib/artwork-relations/types/artwork-relation-group.ts';
import type { ArtworkRelationKind } from '#lib/artwork-relations/types/artwork-relation-kind.ts';
import type { ArtworkRelationType } from '#lib/artwork-relations/types/artwork-relation-type.ts';
import type { RelationSide } from '#lib/artwork-relations/types/relation-side.ts';

type TypeDefinition = { type: ArtworkRelationType; kind: ArtworkRelationKind; side: RelationSide };

export type RelationPayload = { kind: ArtworkRelationKind; side: RelationSide; artwork_id: string };

export const ARTWORK_RELATION_TYPES: readonly TypeDefinition[] = [
	{ type: 'studyFrom', kind: 'study', side: 'from' },
	{ type: 'studyTo', kind: 'study', side: 'to' },
	{ type: 'copyFrom', kind: 'copy', side: 'from' },
	{ type: 'copyTo', kind: 'copy', side: 'to' },
	{ type: 'version', kind: 'version', side: 'from' },
	{ type: 'partFrom', kind: 'part', side: 'from' },
	{ type: 'partTo', kind: 'part', side: 'to' },
	{ type: 'referenceFrom', kind: 'reference', side: 'from' },
	{ type: 'referenceTo', kind: 'reference', side: 'to' },
	{ type: 'related', kind: 'related', side: 'from' }
];

const SYMMETRIC: ReadonlySet<ArtworkRelationKind> = new Set(['version', 'related']);

export function isArtworkRelationType(value: string): value is ArtworkRelationType {
	return ARTWORK_RELATION_TYPES.some((definition) => definition.type === value);
}

export function relationTypeOf(kind: string, side: RelationSide): ArtworkRelationType | undefined {
	const wanted = SYMMETRIC.has(kind as ArtworkRelationKind) ? 'from' : side;
	return ARTWORK_RELATION_TYPES.find(
		(definition) => definition.kind === kind && definition.side === wanted
	)?.type;
}

export function relationTypeOptions(): SelectOption[] {
	return ARTWORK_RELATION_TYPES.map(({ type }) => ({
		value: type,
		label: m.artworkRelations.types[type]
	}));
}

function byTitle(first: ArtworkRelation, second: ArtworkRelation): number {
	return first.artwork.title.localeCompare(second.artwork.title, 'pl');
}

export function groupRelations(relations: readonly ArtworkRelation[]): ArtworkRelationGroup[] {
	return ARTWORK_RELATION_TYPES.flatMap(({ type }) => {
		const artworks = relations
			.filter((relation) => relation.type === type)
			.sort(byTitle)
			.map((relation) => relation.artwork);
		return artworks.length > 0 ? [{ type, label: m.artworkRelations.types[type], artworks }] : [];
	});
}

export function relationError(entries: readonly ArtworkRelationEntry[]): string | undefined {
	if (entries.some((entry) => entry.artwork === null)) return m.artworkRelations.artworkRequired;
	if (entries.some((entry) => entry.type === null)) return m.artworkRelations.typeRequired;
	return undefined;
}

export function relationPayload(entries: readonly ArtworkRelationEntry[]): RelationPayload[] {
	return entries.flatMap(({ type, artwork }) => {
		const definition = ARTWORK_RELATION_TYPES.find((item) => item.type === type);
		return definition && artwork
			? [{ kind: definition.kind, side: definition.side, artwork_id: artwork.id }]
			: [];
	});
}
