import type { ImageRow } from '#lib/collection/image-record.ts';
import type { ArtworkImageInput } from '#lib/catalogue/types/artwork-image-input.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

export type ReviewForm = 'mixed' | 'flashcards' | 'quizzes';

export type QuizMode = 'quiz_image' | 'quiz_title' | 'quiz_style' | 'quiz_pin';

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

export type QuizReason = 'author' | 'style' | 'period';

export type QuizOption = {
	label: string;
	artwork?: WallArtwork;
	reason?: QuizReason;
};

export type Quiz = {
	options: QuizOption[];
	answer: number;
};

export type SessionOptionRow = {
	artwork_id?: string;
	label: string;
	reason?: QuizReason;
	right?: boolean;
};

export type SessionPinRow = {
	x: number;
	y: number;
	image: ImageRow & { id: string };
};

export type SessionRow = {
	artwork_id: string;
	mode: ReviewMode;
	options?: SessionOptionRow[];
	pin?: SessionPinRow;
};

export type ReviewSessionResult = {
	rows: SessionRow[];
	error?: string;
};

export type ReviewPin = {
	x: number;
	y: number;
	image: ArtworkImageInput;
};

export type ReviewItem = {
	artwork: WallArtwork;
	card: ReviewCard | null;
	mode: ReviewMode;
	quiz?: Quiz;
	pin?: ReviewPin;
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

export type ReviewStreakResult = {
	days: number;
	error?: string;
};

export type RecordReviewResult = {
	error?: string;
};

export type ReviewDetails = {
	notes: string;
	credit?: string;
};

export type ReviewDetailsResult = {
	details: Map<string, ReviewDetails>;
	error?: string;
};
