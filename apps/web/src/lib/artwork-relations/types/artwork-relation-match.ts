import type { RelatedArtwork } from './related-artwork.ts';

export type ArtworkRelationMatch = RelatedArtwork & {
	authors: string[];
};
