import type { WallArtwork } from '#lib/collection/types.ts';
import { reviewableArtworks } from './queue.ts';
import type { Quiz, QuizMode, QuizOption, QuizReason, ReviewItem } from './types.ts';

const CHOICES = 4;
const DISTRACTORS = CHOICES - 1;
const BEST = 8;
const CLOSE_YEARS = 50;

const WEIGHTS = {
	style: 4,
	author: 3,
	period: 2,
	type: 2,
	era: 1,
	year: 1,
	place: 1
} as const;

function normalTitle(title: string): string {
	return title.trim().toLocaleLowerCase('pl');
}

function shares(a: string[], b: string[]): boolean {
	return a.some((value) => b.includes(value));
}

function yearOf(artwork: WallArtwork): number | null {
	return artwork.yearTo ?? artwork.yearFrom;
}

function closeInTime(a: WallArtwork, b: WallArtwork): boolean {
	const yearA = yearOf(a);
	const yearB = yearOf(b);
	return yearA !== null && yearB !== null && Math.abs(yearA - yearB) <= CLOSE_YEARS;
}

export function similarity(answer: WallArtwork, other: WallArtwork): number {
	return (
		(shares(answer.styles, other.styles) ? WEIGHTS.style : 0) +
		(shares(answer.authors, other.authors) ? WEIGHTS.author : 0) +
		(answer.period && answer.period === other.period ? WEIGHTS.period : 0) +
		(answer.typeCode && answer.typeCode === other.typeCode ? WEIGHTS.type : 0) +
		(answer.eraCode && answer.eraCode === other.eraCode ? WEIGHTS.era : 0) +
		(closeInTime(answer, other) ? WEIGHTS.year : 0) +
		(answer.location && answer.location === other.location ? WEIGHTS.place : 0)
	);
}

export function closeness(answer: WallArtwork, other: WallArtwork): QuizReason | undefined {
	if (shares(answer.authors, other.authors)) return 'author';
	if (shares(answer.styles, other.styles)) return 'style';
	if (answer.period && answer.period === other.period) return 'period';
	return undefined;
}

function shuffle<T>(values: T[], random: () => number): T[] {
	const shuffled = [...values];
	for (let index = shuffled.length - 1; index > 0; index -= 1) {
		const other = Math.min(index, Math.floor(random() * (index + 1)));
		[shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
	}
	return shuffled;
}

function drawBest<T>(scored: { value: T; score: number }[], random: () => number): T[] {
	return shuffle(
		shuffle(scored, random)
			.sort((a, b) => b.score - a.score)
			.slice(0, BEST),
		random
	)
		.slice(0, DISTRACTORS)
		.map(({ value }) => value);
}

function distractorCandidates(
	answer: WallArtwork,
	pool: WallArtwork[]
): { value: WallArtwork; score: number }[] {
	const taken = new Map<string, { value: WallArtwork; score: number }>();
	for (const artwork of reviewableArtworks(pool)) {
		const title = normalTitle(artwork.title);
		if (artwork.id === answer.id || title === normalTitle(answer.title)) continue;
		const score = similarity(answer, artwork);
		const previous = taken.get(title);
		if (!previous || previous.score < score) taken.set(title, { value: artwork, score });
	}
	return [...taken.values()];
}

function styleCandidates(
	answer: WallArtwork,
	pool: WallArtwork[]
): { value: string; score: number }[] {
	const scores = new Map<string, number>();
	for (const artwork of reviewableArtworks(pool)) {
		if (artwork.id === answer.id) continue;
		const score = similarity(answer, artwork);
		for (const style of artwork.styles) {
			if (answer.styles.includes(style)) continue;
			scores.set(style, Math.max(scores.get(style) ?? 0, score));
		}
	}
	return [...scores].map(([value, score]) => ({ value, score }));
}

export function canAsk(artwork: WallArtwork, mode: QuizMode, pool: WallArtwork[]): boolean {
	if (!artwork.hasImage) return false;
	if (mode === 'quiz_style') {
		return artwork.styles.length > 0 && styleCandidates(artwork, pool).length >= DISTRACTORS;
	}
	return distractorCandidates(artwork, pool).length >= DISTRACTORS;
}

function arrange(right: QuizOption, wrong: QuizOption[], random: () => number): Quiz | undefined {
	if (wrong.length < DISTRACTORS) return undefined;
	const options = shuffle([right, ...wrong], random);
	return { options, answer: options.indexOf(right) };
}

export function buildQuiz(
	artwork: WallArtwork,
	mode: QuizMode,
	pool: WallArtwork[],
	random: () => number = Math.random
): Quiz | undefined {
	if (mode === 'quiz_style') {
		const [style] = artwork.styles;
		if (!style) return undefined;
		const styles = drawBest(styleCandidates(artwork, pool), random);
		return arrange(
			{ label: style },
			styles.map((label) => ({ label })),
			random
		);
	}
	const others = drawBest(distractorCandidates(artwork, pool), random);
	return arrange(
		{ label: artwork.title, artwork },
		others.map((other) => ({
			label: other.title,
			artwork: other,
			reason: closeness(artwork, other)
		})),
		random
	);
}

export function shuffleQuiz(quiz: Quiz, random: () => number = Math.random): Quiz {
	const right = quiz.options[quiz.answer];
	const options = shuffle(quiz.options, random);
	return { options, answer: options.indexOf(right) };
}

export function withQuizzes(
	items: ReviewItem[],
	pool: WallArtwork[],
	random: () => number = Math.random
): ReviewItem[] {
	return items.map((item) => {
		if (item.mode === 'flashcard') return item;
		const quiz = buildQuiz(item.artwork, item.mode, pool, random);
		return quiz ? { ...item, quiz } : { ...item, mode: 'flashcard' };
	});
}

export function quizArtworks(items: ReviewItem[]): WallArtwork[] {
	return items.flatMap(
		(item) => item.quiz?.options.flatMap((option) => option.artwork ?? []) ?? []
	);
}
