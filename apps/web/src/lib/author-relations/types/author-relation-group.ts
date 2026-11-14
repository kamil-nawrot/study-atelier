import type { AuthorRelationType } from './author-relation-type.ts';
import type { RelatedAuthor } from './related-author.ts';

export type AuthorRelationGroup = {
	type: AuthorRelationType;
	label: string;
	authors: RelatedAuthor[];
};
