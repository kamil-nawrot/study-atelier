import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { LifeFormState } from '#lib/values/types/life-form-state.ts';

export type FigureDraft = LifeFormState & {
	country: string;
	image: ArtworkImageInput | null;
};
