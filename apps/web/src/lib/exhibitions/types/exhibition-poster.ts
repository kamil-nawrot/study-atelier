import type { PosterCrop } from '#lib/exhibitions/types/poster-crop.ts';
import type { PosterFilters } from '#lib/exhibitions/types/poster-filters.ts';

export type ExhibitionPoster = {
	artworkId: string | null;
	imageId: string | null;
	crop: PosterCrop | null;
	filters: PosterFilters;
};
