import type { ExhibitionPoster } from '#lib/exhibitions/types/exhibition-poster.ts';

export type ExhibitionSummary = {
	id: string;
	title: string;
	updatedAt: string;
	artworkCount: number;
	coverId: string | null;
	poster?: ExhibitionPoster;
};
