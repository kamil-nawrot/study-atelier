import type { SelectOption } from '@study-atelier/ui';
import { m } from '#lib/i18n/i18n.ts';
import type { RelationSide } from '#lib/artwork-relations/types/relation-side.ts';
import type { AuthorRelation } from '#lib/author-relations/types/author-relation.ts';
import type { AuthorRelationGroup } from '#lib/author-relations/types/author-relation-group.ts';
import type { AuthorRelationKind } from '#lib/author-relations/types/author-relation-kind.ts';
import type { AuthorRelationRow } from '#lib/author-relations/types/author-relation-row.ts';
import type { AuthorRelationType } from '#lib/author-relations/types/author-relation-type.ts';
import type { RelatedAuthor } from '#lib/author-relations/types/related-author.ts';

type TypeDefinition = { type: AuthorRelationType; kind: AuthorRelationKind; side: RelationSide };

export type AuthorRelationPayload = {
	kind: AuthorRelationKind;
	side: RelationSide;
	author_id: string;
};

export const AUTHOR_RELATION_TYPES: readonly TypeDefinition[] = [
	{ type: 'pupilFrom', kind: 'pupil', side: 'from' },
	{ type: 'pupilTo', kind: 'pupil', side: 'to' },
	{ type: 'influenceFrom', kind: 'influence', side: 'from' },
	{ type: 'influenceTo', kind: 'influence', side: 'to' },
	{ type: 'collaboration', kind: 'collaboration', side: 'from' },
	{ type: 'family', kind: 'family', side: 'from' },
	{ type: 'related', kind: 'related', side: 'from' }
];

const SYMMETRIC: ReadonlySet<string> = new Set(['collaboration', 'family', 'related']);

export function isAuthorRelationType(value: string): value is AuthorRelationType {
	return AUTHOR_RELATION_TYPES.some((definition) => definition.type === value);
}

export function authorRelationTypeOf(
	kind: string,
	side: RelationSide
): AuthorRelationType | undefined {
	const wanted = SYMMETRIC.has(kind) ? 'from' : side;
	return AUTHOR_RELATION_TYPES.find(
		(definition) => definition.kind === kind && definition.side === wanted
	)?.type;
}

export function authorRelationTypeOptions(): SelectOption[] {
	return AUTHOR_RELATION_TYPES.map(({ type }) => ({
		value: type,
		label: m.authorRelations.types[type]
	}));
}

function byName(first: RelatedAuthor, second: RelatedAuthor): number {
	return first.name.localeCompare(second.name, 'pl');
}

export function groupAuthorRelations(relations: readonly AuthorRelation[]): AuthorRelationGroup[] {
	return AUTHOR_RELATION_TYPES.flatMap(({ type }) => {
		const authors = relations
			.filter((relation) => relation.type === type)
			.map((relation) => relation.author)
			.sort(byName);
		return authors.length > 0 ? [{ type, label: m.authorRelations.types[type], authors }] : [];
	});
}

export function authorRelationRowsOf(relations: readonly AuthorRelation[]): AuthorRelationRow[] {
	return groupAuthorRelations(relations).flatMap(({ type, authors }) =>
		authors.map((author) => ({ key: author.id, type, author: { ...author } }))
	);
}

export function emptyAuthorRelationRow(key: string = crypto.randomUUID()): AuthorRelationRow {
	return { key, type: '', author: null };
}

export function authorRelationError(rows: readonly AuthorRelationRow[]): string | undefined {
	const started = rows.filter((row) => row.type !== '' || row.author !== null);
	if (started.some((row) => row.author === null)) return m.authorRelations.authorRequired;
	if (started.some((row) => row.type === '')) return m.authorRelations.typeRequired;
	return undefined;
}

export function authorRelationsOfRows(rows: readonly AuthorRelationRow[]): AuthorRelation[] {
	return rows.flatMap(({ type, author }) =>
		type !== '' && author ? [{ type, author: { ...author } }] : []
	);
}

export function authorRelationPayload(
	relations: readonly AuthorRelation[]
): AuthorRelationPayload[] {
	return relations.flatMap(({ type, author }) => {
		const definition = AUTHOR_RELATION_TYPES.find((item) => item.type === type);
		return definition
			? [{ kind: definition.kind, side: definition.side, author_id: author.id }]
			: [];
	});
}
