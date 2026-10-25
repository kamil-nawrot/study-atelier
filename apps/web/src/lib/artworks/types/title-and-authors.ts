import type { ArtworkInput } from '#lib/artworks/types/artwork-input.ts';

export type TitleAndAuthors = Pick<ArtworkInput, 'title' | 'authors'>;
