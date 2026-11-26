import type { AlbumTextSource } from './album-text-source.ts';

export type AlbumEvent = {
	id: string;
	revision: number;
	yearFrom: number | null;
	yearTo: number;
	yearApproximate: boolean;
	name: string;
	description: string | null;
	source: AlbumTextSource | null;
};
