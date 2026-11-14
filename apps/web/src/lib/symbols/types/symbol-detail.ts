import type { FragmentLens } from '#lib/pins/types/fragment-lens.ts';

export type SymbolDetail = {
	pinId: string;
	meaningId: string | null;
	artworkId: string;
	number: number;
	title: string;
	byline: string;
	year: number | null;
	lens?: FragmentLens;
};
