import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';

export type AuthorDetails = {
	image: ArtworkImageInput | null;
	birthYear: number | null;
	deathYear: number | null;
	yearsApproximate: boolean;
	sortName: string | null;
};
