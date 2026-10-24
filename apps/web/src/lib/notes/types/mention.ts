import type { ResolvedPathname } from '$app/types';

export type Mention = {
	href: ResolvedPathname;
	name: string;
	kind: string;
};
