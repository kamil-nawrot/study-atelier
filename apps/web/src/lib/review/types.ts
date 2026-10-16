import type { WallArtwork } from '#lib/collection/types.ts';

export type ReviewForm = 'mixed' | 'flashcards' | 'quizzes';

export type QuizMode = 'quiz_image' | 'quiz_title' | 'quiz_style';

export type ReviewMode = 'flashcard' | QuizMode;

export type ReviewRating = 1 | 2 | 3;

export type ReviewState = 0 | 1 | 2 | 3;

export type ReviewCard = {
	artworkId: string;
	due: Date;
	stability: number;
	difficulty: number;
	state: ReviewState;
	reps: number;
	lapses: number;
	scheduledDays: number;
	learningSteps: number;
	lastReview: Date | null;
};

export type ReviewItem = {
	artwork: WallArtwork;
	card: ReviewCard | null;
	mode: ReviewMode;
};

export type ReviewAnswer = {
	mode: ReviewMode;
	rating: ReviewRating;
	correct?: boolean;
	answerMs?: number;
};

export type ReviewCounts = {
	due: number;
	newAvailable: number;
	newToday: number;
	withImage: number;
};

export type ReviewCardsResult = {
	cards: Map<string, ReviewCard>;
	error?: string;
};

export type ReviewCountsResult = {
	counts?: ReviewCounts;
	error?: string;
};

export type RecordReviewResult = {
	error?: string;
};

export type ReviewDetails = {
	notes: string;
	credit?: string;
};
