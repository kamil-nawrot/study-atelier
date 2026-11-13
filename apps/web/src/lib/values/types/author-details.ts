import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { AuthorRelation } from '#lib/author-relations/types/author-relation.ts';

export type AuthorDetails = {
	image: ArtworkImageInput | null;
	birthYear: number | null;
	deathYear: number | null;
	yearsApproximate: boolean;
	sortName: string | null;
	country: string | null;
	relations: AuthorRelation[];
};
