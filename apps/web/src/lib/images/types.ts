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
	image: CandidateImage | null;
};

export type ImageSearchResult = {
	candidates: ImageCandidate[];
	error?: string;
};
