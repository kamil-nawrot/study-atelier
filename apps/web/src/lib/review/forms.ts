import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { REVIEW_FORMS } from '#lib/profile/preferences.ts';
import type { QuizMode, ReviewForm } from './types.ts';

export function quizzesPossible(
	kinds: readonly QuizMode[],
	artworks: readonly WallArtwork[],
	termPins: number | undefined
): boolean {
	if (kinds.includes('quiz_title') || kinds.includes('quiz_image')) return true;
	if (kinds.includes('quiz_style') && artworks.some((artwork) => artwork.styles.length > 0)) {
		return true;
	}
	return kinds.includes('quiz_pin') && termPins !== 0;
}

export function offeredForms(quizzes: boolean): readonly ReviewForm[] {
	return quizzes ? REVIEW_FORMS : REVIEW_FORMS.filter((form) => form !== 'quizzes');
}
