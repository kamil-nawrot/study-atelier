import type { ArtworkInput } from './artwork-input.ts';

export type ArtworkRecord = ArtworkInput & {
	id: string;
	number: number;
	favourite: boolean;
};
