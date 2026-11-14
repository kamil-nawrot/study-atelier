import type { AuthorRelationType } from './author-relation-type.ts';
import type { RelatedAuthor } from './related-author.ts';

export type AuthorRelation = {
	type: AuthorRelationType;
	author: RelatedAuthor;
};
