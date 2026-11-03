export type NoteLinkSuggestionRow = {
	kind: string;
	id: string;
	record_number: number | null;
	title: string | null;
	authors: string[];
	parents: string[];
};
