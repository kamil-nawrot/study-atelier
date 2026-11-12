import type { ArtworkRelation } from '#lib/artwork-relations/types/artwork-relation.ts';
import type { ArtworkInput } from './artwork-input.ts';

export type ArtworkRecord = Omit<ArtworkInput, 'relations'> & {
	id: string;
	number: number;
	favourite: boolean;
	relations?: ArtworkRelation[];
};
