export type ArtworkValueRow = {
	position: number;
	category_values: {
		category_code: string;
		name: string;
		author_details?: { sort_name: string | null }[];
	} | null;
};
