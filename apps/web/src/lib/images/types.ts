export type CandidateImage = {
	file: string;
	src: string;
	srcset?: string;
	width: number;
	height: number;
	licence: string | null;
	licenceUrl: string | null;
	attribution: string | null;
};

export type ImageCandidate = {
	wikidataId: string;
	title: string;
	authors: string[];
	date?: string;
	image: CandidateImage;
};

export type ImageSearchResult = {
	candidates: ImageCandidate[];
	authorMatch?: boolean;
	error?: string;
};

export type ImageSearchQuery =
	{ kind: 'artwork'; title: string; authors: string[] } | { kind: 'person'; name: string };
