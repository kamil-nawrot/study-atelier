import type { WallArtwork } from '#lib/collection/types.ts';
import type { QuizMode, ReviewCard, ReviewForm, ReviewItem, ReviewMode } from './types.ts';

export const SESSION_SIZE = 20;
export const NEW_PER_DAY = 10;
export const MIN_ARTWORKS = 20;
export const SETTLED_STABILITY_DAYS = 7;
export const RETRY_GAP_MIN = 3;
export const RETRY_GAP_MAX = 5;

const STYLE_QUIZ_EVERY = 3;
const LEARNING_QUIZZES: readonly QuizMode[] = ['quiz_title', 'quiz_image'];
const ALL_QUIZZES: readonly QuizMode[] = ['quiz_title', 'quiz_image', 'quiz_style'];
const REVIEW_STATE = 2;

export type QuizAvailability = (artwork: WallArtwork, mode: QuizMode) => boolean;

export type SessionInput = {
	artworks: WallArtwork[];
	cards: Map<string, ReviewCard>;
	now: Date;
	newToday: number;
	form: ReviewForm;
	canAsk?: QuizAvailability;
};

type SessionEntry = {
	artwork: WallArtwork;
	card: ReviewCard | null;
};

const noQuizzes: QuizAvailability = () => false;

export function startOfDay(now: Date): Date {
	return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function endOfDay(now: Date): Date {
	return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
}

export function reviewableArtworks(artworks: WallArtwork[]): WallArtwork[] {
	return artworks.filter((artwork) => artwork.hasImage);
}

export function missingArtworks(artworks: WallArtwork[]): number {
	return Math.max(0, MIN_ARTWORKS - reviewableArtworks(artworks).length);
}

export function newAllowance(newToday: number): number {
	return Math.max(0, NEW_PER_DAY - newToday);
}

export function isDueToday(card: ReviewCard, now: Date): boolean {
	return card.due < endOfDay(now);
}

export function interleaveByEra<T extends { artwork: WallArtwork }>(entries: T[]): T[] {
	const remaining = [...entries];
	const ordered: T[] = [];
	while (remaining.length > 0) {
		const previous = ordered.at(-1)?.artwork.eraCode;
		const index = remaining.findIndex(
			(entry) => previous === undefined || entry.artwork.eraCode !== previous
		);
		ordered.push(...remaining.splice(index === -1 ? 0 : index, 1));
	}
	return ordered;
}

export function sessionEntries({
	artworks,
	cards,
	now,
	newToday
}: Omit<SessionInput, 'form' | 'canAsk'>): SessionEntry[] {
	const pool = reviewableArtworks(artworks);
	if (pool.length < MIN_ARTWORKS) return [];

	const due = pool
		.flatMap((artwork) => {
			const card = cards.get(artwork.id);
			return card && isDueToday(card, now) ? [{ artwork, card }] : [];
		})
		.sort((a, b) => a.card.due.getTime() - b.card.due.getTime())
		.slice(0, SESSION_SIZE);
	const fresh = pool
		.filter((artwork) => !cards.has(artwork.id))
		.sort((a, b) => a.number - b.number)
		.slice(0, Math.min(newAllowance(newToday), SESSION_SIZE - due.length))
		.map((artwork) => ({ artwork, card: null }));

	return interleaveByEra<SessionEntry>([...due, ...fresh]);
}

export function chooseMode(
	card: ReviewCard | null,
	form: ReviewForm,
	position: number,
	canAsk: (mode: QuizMode) => boolean
): ReviewMode {
	if (form === 'flashcards') return 'flashcard';
	if (form === 'quizzes') {
		const quizzes = ALL_QUIZZES.filter(canAsk);
		return quizzes.length > 0 ? quizzes[position % quizzes.length] : 'flashcard';
	}
	if (!card || card.state !== REVIEW_STATE) {
		const quizzes = LEARNING_QUIZZES.filter(canAsk);
		return quizzes.length > 0 ? quizzes[position % quizzes.length] : 'flashcard';
	}
	if (
		card.stability < SETTLED_STABILITY_DAYS &&
		position % STYLE_QUIZ_EVERY === STYLE_QUIZ_EVERY - 1 &&
		canAsk('quiz_style')
	) {
		return 'quiz_style';
	}
	return 'flashcard';
}

export function buildSession(input: SessionInput): ReviewItem[] {
	const canAsk = input.canAsk ?? noQuizzes;
	return sessionEntries(input).map((entry, position) => ({
		...entry,
		mode: chooseMode(entry.card, input.form, position, (mode) => canAsk(entry.artwork, mode))
	}));
}

export function retryLater(
	queue: ReviewItem[],
	position: number,
	item: ReviewItem,
	random: () => number = Math.random
): ReviewItem[] {
	const span = RETRY_GAP_MAX - RETRY_GAP_MIN + 1;
	const gap = RETRY_GAP_MIN + Math.min(span - 1, Math.floor(random() * span));
	const index = Math.min(position + 1 + gap, queue.length);
	return [...queue.slice(0, index), item, ...queue.slice(index)];
}
