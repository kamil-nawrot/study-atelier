import { ERA_CODES } from '#lib/catalogue/eras/eras.ts';
import type { EraCode } from '#lib/catalogue/types/era-code.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { m } from '#lib/i18n/index.ts';
import {
	endOfDay,
	isDueToday,
	MIN_ARTWORKS,
	reviewableArtworks,
	SETTLED_STABILITY_DAYS,
	type SessionInput,
	sessionCounts,
	startOfDay
} from './queue.ts';
import type { ReviewCard, ReviewItem, ReviewRating } from './types.ts';

export type ReviewScope =
	| { kind: 'all' }
	| { kind: 'era'; code: EraCode }
	| { kind: 'period'; name: string }
	| { kind: 'style'; name: string };

export type ScopeChoice = {
	scope: ReviewScope;
	count: number;
};

export type AtelierKnowledge = {
	settled: number;
	learning: number;
	fresh: number;
};

export type SummaryGroup = {
	rating: ReviewRating;
	artworks: WallArtwork[];
};

const MIN_DUE_IN_SCOPE = 10;
const TROUBLES = 4;
const RELEARNING_STATE = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

const relativeDays = new Intl.RelativeTimeFormat('pl', { numeric: 'auto' });

function valuesWithEnough(
	artworks: WallArtwork[],
	valuesOf: (artwork: WallArtwork) => string[]
): string[] {
	const counts = new Map<string, number>();
	for (const artwork of artworks) {
		for (const value of valuesOf(artwork)) counts.set(value, (counts.get(value) ?? 0) + 1);
	}
	return [...counts]
		.filter(([, count]) => count >= MIN_ARTWORKS)
		.sort(([a, countA], [b, countB]) => countB - countA || a.localeCompare(b, 'pl'))
		.map(([name]) => name);
}

function dueIn(artworks: WallArtwork[], cards: Map<string, ReviewCard>, now: Date): number {
	return artworks.filter((artwork) => {
		const card = cards.get(artwork.id);
		return card !== undefined && isDueToday(card, now);
	}).length;
}

export function scopeOptions(
	artworks: WallArtwork[],
	cards: Map<string, ReviewCard>,
	now: Date
): ReviewScope[] {
	const pool = reviewableArtworks(artworks);
	const narrower: ReviewScope[] = [
		...ERA_CODES.map((code): ReviewScope => ({ kind: 'era', code })),
		...valuesWithEnough(pool, (artwork) => (artwork.period ? [artwork.period] : [])).map(
			(name): ReviewScope => ({ kind: 'period', name })
		),
		...valuesWithEnough(pool, (artwork) => artwork.styles).map((name): ReviewScope => ({
			kind: 'style',
			name
		}))
	];
	return [
		{ kind: 'all' },
		...narrower.filter((scope) => {
			const scoped = scopeArtworks(pool, scope);
			return scoped.length >= MIN_ARTWORKS && dueIn(scoped, cards, now) >= MIN_DUE_IN_SCOPE;
		})
	];
}

export function freeScopeOptions(
	artworks: WallArtwork[],
	cards: Map<string, ReviewCard>
): ScopeChoice[] {
	const reviewed = reviewableArtworks(artworks).filter((artwork) => cards.has(artwork.id));
	if (reviewed.length === 0) return [];
	const narrower: ReviewScope[] = [
		...ERA_CODES.map((code): ReviewScope => ({ kind: 'era', code })),
		...valuesWithEnough(reviewed, (artwork) => (artwork.period ? [artwork.period] : [])).map(
			(name): ReviewScope => ({ kind: 'period', name })
		),
		...valuesWithEnough(reviewed, (artwork) => artwork.styles).map((name): ReviewScope => ({
			kind: 'style',
			name
		}))
	];
	return [
		{ scope: { kind: 'all' }, count: reviewed.length },
		...narrower
			.map((scope) => ({ scope, count: scopeArtworks(reviewed, scope).length }))
			.filter((choice) => choice.count >= MIN_ARTWORKS)
	];
}

export function scopeKey(scope: ReviewScope): string {
	switch (scope.kind) {
		case 'all':
			return 'all';
		case 'era':
			return `era:${scope.code}`;
		default:
			return `${scope.kind}:${scope.name}`;
	}
}

export function sameScope(a: ReviewScope, b: ReviewScope): boolean {
	return scopeKey(a) === scopeKey(b);
}

export function scopeArtworks(artworks: WallArtwork[], scope: ReviewScope): WallArtwork[] {
	switch (scope.kind) {
		case 'all':
			return artworks;
		case 'era':
			return artworks.filter((artwork) => artwork.eraCode === scope.code);
		case 'period':
			return artworks.filter((artwork) => artwork.period === scope.name);
		case 'style':
			return artworks.filter((artwork) => artwork.styles.includes(scope.name));
	}
}

export function atelierKnowledge(
	artworks: WallArtwork[],
	cards: Map<string, ReviewCard>
): AtelierKnowledge {
	const knowledge: AtelierKnowledge = { settled: 0, learning: 0, fresh: 0 };
	for (const artwork of reviewableArtworks(artworks)) {
		const card = cards.get(artwork.id);
		if (!card) knowledge.fresh += 1;
		else if (card.stability >= SETTLED_STABILITY_DAYS) knowledge.settled += 1;
		else knowledge.learning += 1;
	}
	return knowledge;
}

export function troubles(artworks: WallArtwork[], cards: Map<string, ReviewCard>): WallArtwork[] {
	return reviewableArtworks(artworks)
		.flatMap((artwork) => {
			const card = cards.get(artwork.id);
			return card && (card.lapses > 0 || card.state === RELEARNING_STATE)
				? [{ artwork, reviewed: card.lastReview?.getTime() ?? 0 }]
				: [];
		})
		.sort((a, b) => b.reviewed - a.reviewed)
		.slice(0, TROUBLES)
		.map(({ artwork }) => artwork);
}

function daysBetween(from: Date, to: Date): number {
	return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

export function nextWaiting(
	artworks: WallArtwork[],
	cards: Map<string, ReviewCard>,
	now: Date
): Date | null {
	const pool = reviewableArtworks(artworks);
	const later = pool.flatMap((artwork) => {
		const card = cards.get(artwork.id);
		if (!card) return [endOfDay(now)];
		return card.due >= endOfDay(now) ? [card.due] : [];
	});
	if (later.length === 0) return null;
	return new Date(Math.min(...later.map((date) => date.getTime())));
}

export function authorsOf(artwork: WallArtwork): string {
	return artwork.authors.length > 0 ? artwork.authors.join(', ') : m.ui.unknownAuthor;
}

export function formatWhen(date: Date, now: Date): string {
	return relativeDays.format(daysBetween(now, date), 'day');
}

export function waitingTomorrow(
	artworks: WallArtwork[],
	cards: Map<string, ReviewCard>,
	now: Date,
	limits: Pick<SessionInput, 'sessionSize' | 'newPerDay'> = {}
): number {
	const { known, fresh } = sessionCounts({
		artworks,
		cards,
		now: endOfDay(now),
		newToday: 0,
		...limits
	});
	return known + fresh;
}

export function summaryGroups(
	answers: { item: ReviewItem; rating: ReviewRating }[]
): SummaryGroup[] {
	const first = new Map<string, { artwork: WallArtwork; rating: ReviewRating }>();
	for (const { item, rating } of answers) {
		if (!first.has(item.artwork.id)) first.set(item.artwork.id, { artwork: item.artwork, rating });
	}
	const ratings: ReviewRating[] = [1, 2, 3];
	return ratings.flatMap((rating) => {
		const grouped = [...first.values()].filter((answer) => answer.rating === rating);
		return grouped.length > 0
			? [{ rating, artworks: grouped.map((answer) => answer.artwork) }]
			: [];
	});
}
