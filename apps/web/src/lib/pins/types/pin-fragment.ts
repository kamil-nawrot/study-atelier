import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';

export type PinFragment = {
	pinId: string;
	artworkId: string;
	x: number;
	y: number;
	viewWidth: number;
	text: string;
	image: ArtworkImageInput | null;
	cropPath?: string;
};
