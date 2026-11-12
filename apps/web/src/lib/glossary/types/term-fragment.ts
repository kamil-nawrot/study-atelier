import type { FragmentThumbnail } from '#lib/pins/types/fragment-thumbnail.ts';

export type TermFragment = {
	pinId: string;
	number: number;
	title: string;
	text: string;
	crop?: string;
	thumbnail: FragmentThumbnail;
};
