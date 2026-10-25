import type { ImageRow } from '#lib/images/types/image-row.ts';

export type SessionPinRow = {
	x: number;
	y: number;
	image: ImageRow & { id: string };
};
