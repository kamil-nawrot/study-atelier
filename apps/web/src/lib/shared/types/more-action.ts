import type { LucideIcon } from '@lucide/svelte';
import type { ResolvedPathname } from '$app/types';

export type MoreAction = {
	label: string;
	icon: LucideIcon;
	href?: ResolvedPathname;
	onclick?: () => void;
	danger?: boolean;
	reason?: string;
};
