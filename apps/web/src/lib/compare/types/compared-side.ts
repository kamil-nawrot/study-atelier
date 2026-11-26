import type { ArtworkInput } from '#lib/artworks/types/artwork-input.ts';

export type ComparedSide = Omit<ArtworkInput, 'relations'>;
