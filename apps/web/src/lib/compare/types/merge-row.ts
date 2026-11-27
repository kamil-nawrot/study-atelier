import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { RowCellItem } from './row-cell-item.ts';

export type TickItem = RowCellItem & {
	image?: ArtworkImageInput;
	credit?: string;
	ticked?: boolean;
	disabled?: boolean;
	ontoggle?: () => void;
};

type RowBase = { key: string; label: string; text?: boolean };

export type MergeRow = RowBase &
	(
		| {
				kind: 'pick';
				mine: RowCellItem[];
				album: RowCellItem[];
				fromAlbum: boolean;
				onpick: (fromAlbum: boolean) => void;
		  }
		| { kind: 'tick'; mine: TickItem[]; album: TickItem[] }
		| { kind: 'same'; value: TickItem[] }
		| { kind: 'plain'; mine: TickItem[]; album: TickItem[] }
	);
