import type { ImageCandidate } from './image-candidate.ts';

export type ImageSearchResult = {
	candidates: ImageCandidate[];
	authorMatch?: boolean;
	further?: boolean;
	error?: string;
};
