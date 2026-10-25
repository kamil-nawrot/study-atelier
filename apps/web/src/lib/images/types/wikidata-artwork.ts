import type { SourceDate } from './source-date.ts';

export type WikidataArtwork = {
	wikidataId: string;
	title: string;
	creators: string[];
	creatorNames: string[];
	hasCreator: boolean;
	date: SourceDate | null;
	file: string;
};
