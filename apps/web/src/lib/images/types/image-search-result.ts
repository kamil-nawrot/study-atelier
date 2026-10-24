import type { ImageCandidate } from './image-candidate.ts';

export type ImageSearchResult = {
	candidates: ImageCandidate[];
	authorMatch?: boolean;
	error?: string;
};
