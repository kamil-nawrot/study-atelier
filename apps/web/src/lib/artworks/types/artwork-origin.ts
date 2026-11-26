import type { ResolvedPathname } from '$app/types';

export type ArtworkOrigin = {
	albumTitle: string;
	albumHref: ResolvedPathname;
	newerHref?: ResolvedPathname;
};
