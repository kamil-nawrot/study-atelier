import type { SourceDate } from './source-date.ts';

export type WikidataPerson = {
	wikidataId: string;
	name: string;
	born: SourceDate | null;
	died: SourceDate | null;
	file: string;
};
