import { ERA_CODES } from '#lib/collection/eras.ts';
import type { EraCode, WallArtwork } from '#lib/collection/types.ts';
import { m } from '#lib/i18n/index.ts';
import {
	endOfDay,
	MIN_ARTWORKS,
	reviewableArtworks,
	SETTLED_STABILITY_DAYS,
	sessionEntries,
	startOfDay
} from './queue.ts';
import type { ReviewCard, ReviewItem, ReviewRating } from './types.ts';

export type ReviewScope =
	| { kind: 'all' }
	| { kind: 'era'; code: EraCode }
	| { kind: 'period'; name: string }
	| { kind: 'style'; name: string };

export type EraMemory = {
	code: EraCode;
	remembered: number;
	total: number;
};

export type SummaryGroup = {
	rating: ReviewRating;
	artworks: WallArtwork[];
};

const SECONDS_PER_ARTWORK = 25;
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

export function scopeOptions(artworks: WallArtwork[]): ReviewScope[] {
	const pool = reviewableArtworks(artworks);
	return [
		{ kind: 'all' },
		...ERA_CODES.filter((code) => pool.some((artwork) => artwork.eraCode === code)).map(
			(code): ReviewScope => ({ kind: 'era', code })
		),
		...valuesWithEnough(pool, (artwork) => (artwork.period ? [artwork.period] : [])).map(
			(name): ReviewScope => ({ kind: 'period', name })
		),
		...valuesWithEnough(pool, (artwork) => artwork.styles).map((name): ReviewScope => ({
			kind: 'style',
			name
		}))
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

export function memoryByEra(artworks: WallArtwork[], cards: Map<string, ReviewCard>): EraMemory[] {
	const pool = reviewableArtworks(artworks);
	return ERA_CODES.flatMap((code) => {
		const inEra = pool.filter((artwork) => artwork.eraCode === code);
		if (inEra.length === 0) return [];
		const remembered = inEra.filter(
			(artwork) => (cards.get(artwork.id)?.stability ?? 0) >= SETTLED_STABILITY_DAYS
		).length;
		return [{ code, remembered, total: inEra.length }];
	});
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

export function formatWhen(date: Date, now: Date): string {
	return relativeDays.format(daysBetween(now, date), 'day');
}

export function formatInterval(due: Date, now: Date): string {
	if (due < endOfDay(now)) return m.review.interval.today;
	const days = daysBetween(now, due);
	return days === 1 ? m.review.interval.tomorrow : m.review.interval.days(days);
}

export function estimateMinutes(count: number): number {
	return Math.max(1, Math.round((count * SECONDS_PER_ARTWORK) / 60));
}

export function waitingTomorrow(
	artworks: WallArtwork[],
	cards: Map<string, ReviewCard>,
	now: Date
): number {
	return sessionEntries({ artworks, cards, now: endOfDay(now), newToday: 0 }).length;
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
