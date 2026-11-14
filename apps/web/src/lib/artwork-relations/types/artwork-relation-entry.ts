import type { ArtworkRelationType } from './artwork-relation-type.ts';
import type { RelatedArtwork } from './related-artwork.ts';

export type ArtworkRelationEntry = {
	type: ArtworkRelationType | null;
	artwork: RelatedArtwork | null;
};
