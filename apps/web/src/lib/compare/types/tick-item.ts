import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { RowCellItem } from './row-cell-item.ts';

export type TickItem = RowCellItem & {
	image?: ArtworkImageInput;
	credit?: string;
	ticked?: boolean;
	disabled?: boolean;
	ontoggle?: () => void;
};
