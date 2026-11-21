import type { LucideIcon } from '@lucide/svelte';
import type { SortableRecord } from '#lib/card-index/card-index-sort/card-index-sort.ts';

export type ListedRecord = SortableRecord & {
	id: string;
	note?: string;
	detail?: string;
	icon?: LucideIcon;
	iconLabel?: string;
};
