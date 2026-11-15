import type { ExhibitionPoster } from '#lib/exhibitions/types/exhibition-poster.ts';
import type { ExhibitionDocument } from '#lib/exhibitions/types/exhibition-document.ts';

export type Exhibition = {
	id: string;
	title: string;
	document: ExhibitionDocument;
	revision: number;
	updatedAt: string;
	poster: ExhibitionPoster;
};
