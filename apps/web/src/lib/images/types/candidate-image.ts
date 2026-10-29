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
