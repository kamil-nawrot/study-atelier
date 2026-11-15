import type { RelationLink } from './relation-link.ts';

export type ReviewRelations = {
	artworks: RelationLink[];
	authors: RelationLink[];
};
