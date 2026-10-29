export type Place = {
	name: string;
	path: string;
	previous?: Place;
	steps?: number;
};
