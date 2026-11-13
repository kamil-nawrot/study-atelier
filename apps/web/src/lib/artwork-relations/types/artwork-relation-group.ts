import type { ArtworkRelationType } from './artwork-relation-type.ts';
import type { RelatedArtwork } from './related-artwork.ts';

export type ArtworkRelationGroup = {
	type: ArtworkRelationType;
	label: string;
	artworks: RelatedArtwork[];
};
