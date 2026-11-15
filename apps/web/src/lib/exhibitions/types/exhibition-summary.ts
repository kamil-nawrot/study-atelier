import type { ExhibitionPoster } from '#lib/exhibitions/types/exhibition-poster.ts';
import type { PosterImage } from '#lib/exhibitions/types/poster-image.ts';

export type ExhibitionSummary = {
	id: string;
	title: string;
	updatedAt: string;
	artworkCount: number;
	coverId: string | null;
	poster?: ExhibitionPoster;
	posterImage?: PosterImage;
};
