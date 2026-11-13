import type { AuthorRelationType } from './author-relation-type.ts';
import type { RelatedAuthor } from './related-author.ts';

export type AuthorRelationRow = {
	key: string;
	type: AuthorRelationType | '';
	author: RelatedAuthor | null;
};
