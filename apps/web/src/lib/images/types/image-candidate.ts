import type { CandidateImage } from './candidate-image.ts';

export type ImageCandidate = {
	wikidataId: string;
	title: string;
	authors: string[];
	date?: string;
	image: CandidateImage;
};
