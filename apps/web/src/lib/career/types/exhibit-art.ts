import type { asset } from '$app/paths';

export type ExhibitArt = {
	file: Parameters<typeof asset>[0];
	credit: string;
	licence: string;
	commonsFile: string;
};
