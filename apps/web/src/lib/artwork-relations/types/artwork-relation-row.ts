import type { ArtworkRelationType } from './artwork-relation-type.ts';
import type { RelatedArtwork } from './related-artwork.ts';

export type ArtworkRelationRow = {
	key: string;
	type: ArtworkRelationType | '';
	artwork: RelatedArtwork | null;
};
