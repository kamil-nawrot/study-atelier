import type { RowCellItem } from './row-cell-item.ts';
import type { TickItem } from './tick-item.ts';

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
