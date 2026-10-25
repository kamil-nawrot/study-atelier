import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';

export type AuthorFormState = {
	image: ArtworkImageInput | null;
	birthYear: string;
	birthBeforeCommonEra: boolean;
	deathYear: string;
	deathBeforeCommonEra: boolean;
	yearsApproximate: boolean;
	sortByOther: boolean;
	sortName: string;
};
