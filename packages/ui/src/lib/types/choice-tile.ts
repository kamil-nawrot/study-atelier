import type { LucideIcon } from '@lucide/svelte';

export type ChoiceTile = {
	value: string;
	label: string;
	note?: string;
	icon?: LucideIcon;
};
