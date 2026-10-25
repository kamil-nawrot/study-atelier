import type { ReviewForm } from '#lib/review/types/review-form.ts';
import type { QuizMode } from '#lib/review/types/quiz-mode.ts';

export type Preferences = {
	reviewSessionSize: number;
	reviewNewPerDay: number;
	reviewForm: ReviewForm;
	reviewQuizKinds: QuizMode[];
	reviewFree: boolean;
	viewShowPins: boolean;
	viewLoupeOn: boolean;
	fetchImage: boolean;
	fetchDefinition: boolean;
	fetchForms: boolean;
	fetchEvent: boolean;
};
