import type { QuizMode } from '#lib/review/types/quiz-mode.ts';
import type { ReviewForm } from '#lib/review/types/review-form.ts';
import type { Preferences } from '#lib/profile/types/preferences.ts';
import type { PreferencesPart } from '#lib/profile/types/preferences-part.ts';

export const SESSION_SIZES = [10, 20, 30, 40] as const;
export const NEW_PER_DAY_CHOICES = [5, 10, 15, 20] as const;
export const GLOSSARY_QUESTION_CHOICES = [1, 2, 3] as const;
export const REVIEW_FORMS: readonly ReviewForm[] = ['mixed', 'flashcards', 'quizzes'];
export const QUIZ_KINDS: readonly QuizMode[] = [
	'quiz_image',
	'quiz_title',
	'quiz_author',
	'quiz_style',
	'quiz_pin'
];

export const defaultPreferences: Preferences = {
	reviewSessionSize: 20,
	reviewNewPerDay: 10,
	reviewForm: 'mixed',
	reviewQuizKinds: [...QUIZ_KINDS],
	reviewFree: true,
	reviewGlossaryQuestions: 1,
	careerShown: true,
	viewShowPins: false,
	viewLoupeOn: false,
	fetchImage: true,
	fetchDefinition: true,
	fetchForms: true,
	fetchEvent: true
};

const PART_FIELDS: Record<PreferencesPart, readonly (keyof Preferences)[]> = {
	review: [
		'reviewSessionSize',
		'reviewNewPerDay',
		'reviewForm',
		'reviewQuizKinds',
		'reviewFree',
		'reviewGlossaryQuestions',
		'careerShown'
	],
	view: ['viewShowPins', 'viewLoupeOn'],
	sources: ['fetchImage', 'fetchDefinition', 'fetchForms', 'fetchEvent']
};

function sameKinds(left: QuizMode[], right: QuizMode[]): boolean {
	return (
		left.length === right.length &&
		QUIZ_KINDS.every((kind) => left.includes(kind) === right.includes(kind))
	);
}

export function preferencesChanged(
	part: PreferencesPart,
	current: Preferences,
	reference: Preferences
): boolean {
	return PART_FIELDS[part].some((field) =>
		field === 'reviewQuizKinds'
			? !sameKinds(current.reviewQuizKinds, reference.reviewQuizKinds)
			: current[field] !== reference[field]
	);
}

export function toggledKind(kinds: QuizMode[], kind: QuizMode, on: boolean): QuizMode[] {
	return QUIZ_KINDS.filter((item) => (item === kind ? on : kinds.includes(item)));
}
