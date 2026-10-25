import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';

export type StoredImage = Exclude<ArtworkImageInput, { kind: 'file' }>;
