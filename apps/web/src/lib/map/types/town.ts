export type Town = {
	name: string;
	countryCode: string;
	longitude: number;
	latitude: number;
	wikidataId?: string;
	region?: string;
	otherNames?: string[];
};
