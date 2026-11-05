import type { FragmentThumbnail } from './fragment-thumbnail.ts';

export type TermFragment = {
	pinId: string;
	number: number;
	title: string;
	text: string;
	crop?: string;
	thumbnail: FragmentThumbnail;
};
