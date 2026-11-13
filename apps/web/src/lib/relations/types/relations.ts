import type { AuthorRelation } from '#lib/author-relations/types/author-relation.ts';
import type { RelatedEvent } from './related-event.ts';
import type { RelatedGroup } from './related-group.ts';
import type { RelationsKind } from './relations-kind.ts';
import type { TypeCount } from './type-count.ts';
import type { YearSpan } from './year-span.ts';

export type Relations = {
	kind: RelationsKind;
	bounds?: YearSpan;
	years: number[];
	groups: RelatedGroup[];
	types: TypeCount[];
	total: number;
	mastered?: number;
	events?: RelatedEvent[];
	authors?: AuthorRelation[];
};
