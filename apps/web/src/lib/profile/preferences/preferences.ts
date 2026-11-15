import type { QuizMode } from '#lib/review/types/quiz-mode.ts';
import type { ReviewForm } from '#lib/review/types/review-form.ts';
import type { Preferences } from '#lib/profile/types/preferences.ts';
import type { PreferencesPart } from '#lib/profile/types/preferences-part.ts';

export const SESSION_SIZES = [10, 20, 30, 40] as const;
export const NEW_PER_DAY_CHOICES = [5, 10, 15, 20] as const;
export const EXTRA_QUESTION_CHOICES = [1, 2, 3] as const;
export const EXTRA_KINDS = [
	{ on: 'reviewGlossaryOn', count: 'reviewGlossaryQuestions' },
	{ on: 'reviewSymbolsOn', count: 'reviewSymbolQuestions' },
	{ on: 'reviewNotesOn', count: 'reviewNoteQuestions' },
	{ on: 'reviewPairsOn', count: 'reviewPairQuestions' },
	{ on: 'reviewRelationsOn', count: 'reviewRelationQuestions' }
] as const;
export const REVIEW_FORMS: readonly ReviewForm[] = ['mixed', 'flashcards', 'quizzes'];
export const QUIZ_KINDS: readonly QuizMode[] = [
	'quiz_image',
	'quiz_title',
	'quiz_author',
	'quiz_style',
	'quiz_pin',
	'quiz_typed'
];

export const RECOGNITION_KINDS: readonly QuizMode[] = QUIZ_KINDS.filter(
	(kind) => kind !== 'quiz_style'
);

function matchesArtwork(kind: QuizMode): boolean {
	return kind !== 'quiz_typed' && kind !== 'quiz_style';
}

export function hasArtworkQuiz(kinds: readonly QuizMode[]): boolean {
	return kinds.some(matchesArtwork);
}

export function lastArtworkQuiz(kinds: readonly QuizMode[], kind: QuizMode): boolean {
	return matchesArtwork(kind) && kinds.includes(kind) && kinds.filter(matchesArtwork).length === 1;
}

export const defaultPreferences: Preferences = {
	reviewSessionSize: 20,
	reviewNewPerDay: 10,
	reviewForm: 'mixed',
	reviewQuizKinds: [...QUIZ_KINDS],
	reviewFree: true,
	reviewGlossaryOn: true,
	reviewGlossaryQuestions: 1,
	reviewSymbolsOn: true,
	reviewSymbolQuestions: 1,
	reviewNotesOn: false,
	reviewNoteQuestions: 1,
	reviewPairsOn: true,
	reviewPairQuestions: 1,
	reviewRelationsOn: true,
	reviewRelationQuestions: 1,
	reviewYearQuestions: false,
	reviewOrderQuestions: false,
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
		'reviewGlossaryOn',
		'reviewGlossaryQuestions',
		'reviewSymbolsOn',
		'reviewSymbolQuestions',
		'reviewNotesOn',
		'reviewNoteQuestions',
		'reviewPairsOn',
		'reviewPairQuestions',
		'reviewRelationsOn',
		'reviewRelationQuestions',
		'reviewYearQuestions',
		'reviewOrderQuestions'
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
