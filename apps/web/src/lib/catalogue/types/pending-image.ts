import type { ImageSize } from './image-size.ts';

export type PendingImage = {
	sourceFile?: string;
	ownPath?: string;
	size?: ImageSize;
};
