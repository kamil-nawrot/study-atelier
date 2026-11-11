import type { LucideIcon } from '@lucide/svelte';

export type MoreAction = {
	label: string;
	icon: LucideIcon;
	href?: string;
	onclick?: () => void;
	danger?: boolean;
	reason?: string;
};
