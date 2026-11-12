import type { FragmentLens } from '#lib/pins/types/fragment-lens.ts';

export type AtlasSymbol = {
	id: string;
	name: string;
	createdAt: string;
	firstMeaning?: string;
	meaningCount: number;
	pinCount: number;
	cover?: FragmentLens;
};
