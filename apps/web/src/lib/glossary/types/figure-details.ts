import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';

export type FigureDetails = {
	birthYear: number | null;
	deathYear: number | null;
	yearsApproximate: boolean;
	country: string | null;
	image: ArtworkImageInput | null;
};
