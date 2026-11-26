import type { Snippet } from 'svelte';
import type { RowAction } from './row-action.ts';
import type { RowCellItem } from './row-cell-item.ts';

export type DisplayRow = {
	key: string;
	label: string;
	left: RowCellItem[] | Snippet;
	right: RowCellItem[] | Snippet;
	text?: boolean;
	actions?: RowAction[];
};
