import type { ImageRow } from '#lib/images/image-record/image-record.ts';

export type SessionPinRow = {
	x: number;
	y: number;
	image: ImageRow & { id: string };
};
