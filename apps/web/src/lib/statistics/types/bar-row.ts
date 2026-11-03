import type { ResolvedPathname } from '$app/types';

export type BarRow = {
	key: string;
	name: string;
	count: number;
	href?: ResolvedPathname;
	muted?: boolean;
};
