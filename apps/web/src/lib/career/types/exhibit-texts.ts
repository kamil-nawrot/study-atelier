export type ExhibitTexts = {
	name: string;
	about: string;
	hint?: string;
	awarded?: string;
	count?: (next?: number) => string;
};
