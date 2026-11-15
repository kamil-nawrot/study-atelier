import type { ArtworkRelationType } from '#lib/artwork-relations/types/artwork-relation-type.ts';
import type { AuthorRelationType } from '#lib/author-relations/types/author-relation-type.ts';

export type RelationQuestion =
	Exclude<ArtworkRelationType, 'related'> | Exclude<AuthorRelationType, 'related'>;
