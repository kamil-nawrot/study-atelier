export type Page = {
	pageid: number;
	title: string;
	extract?: string;
	fullurl?: string;
	pageprops?: { wikibase_item?: string; disambiguation?: string };
};
