import type { AuthorDetails } from './author-details.ts';
import type { LocationDetails } from './location-details.ts';

export type ValueDetails = {
	summary: string;
	notes: string;
	author?: AuthorDetails;
	location?: LocationDetails;
};
