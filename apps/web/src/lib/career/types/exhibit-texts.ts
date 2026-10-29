export type ExhibitTexts = {
	name: string;
	about: string;
	hint?: string;
	awarded?: string;
	count?: (value: number, next?: number) => string;
};
