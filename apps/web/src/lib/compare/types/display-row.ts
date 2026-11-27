import type { RowCellItem } from './row-cell-item.ts';

export type DisplayRow = {
	key: string;
	label: string;
	left: RowCellItem[];
	right: RowCellItem[];
	text?: boolean;
};
