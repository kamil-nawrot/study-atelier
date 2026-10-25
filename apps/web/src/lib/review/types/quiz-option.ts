import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { QuizReason } from './quiz-reason.ts';

export type QuizOption = {
	label: string;
	artwork?: WallArtwork;
	reason?: QuizReason;
};
