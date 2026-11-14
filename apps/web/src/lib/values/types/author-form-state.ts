import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { AuthorRelationRow } from '#lib/author-relations/types/author-relation-row.ts';

export type AuthorFormState = {
	image: ArtworkImageInput | null;
	birthYear: string;
	birthBeforeCommonEra: boolean;
	deathYear: string;
	deathBeforeCommonEra: boolean;
	yearsApproximate: boolean;
	sortByOther: boolean;
	sortName: string;
	country: string;
	relations: AuthorRelationRow[];
};
