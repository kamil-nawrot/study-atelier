import type { ArtworkRelationType } from './artwork-relation-type.ts';
import type { RelatedArtwork } from './related-artwork.ts';

export type ArtworkRelation = {
	type: ArtworkRelationType;
	artwork: RelatedArtwork;
};
