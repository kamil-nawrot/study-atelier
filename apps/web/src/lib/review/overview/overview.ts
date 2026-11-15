import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import {
	endOfDay,
	reviewableArtworks,
	SETTLED_STABILITY_DAYS,
	startOfDay
} from '#lib/review/queue/queue.ts';
import type { ReviewCard } from '#lib/review/types/review-card.ts';
import type { ReviewItem } from '#lib/review/types/review-item.ts';
import type { ReviewRating } from '#lib/review/types/review-rating.ts';
import type { ReviewScope } from '#lib/review/types/review-scope.ts';
import type { AtelierKnowledge } from '#lib/review/types/atelier-knowledge.ts';
import type { SummaryGroup } from '#lib/review/types/summary-group.ts';

const TROUBLES = 4;
const DAY_MS = 24 * 60 * 60 * 1000;

const relativeDays = new Intl.RelativeTimeFormat('pl', { numeric: 'auto' });

export function scopeKey(scope: ReviewScope): string {
	switch (scope.kind) {
		case 'all':
		case 'seen':
			return scope.kind;
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
		case 'seen':
			return artworks.filter((artwork) => artwork.seen === true);
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
			return card && (card.lapses > 0 || card.lastRating === 1)
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

export function describeArtwork(artwork: WallArtwork): string {
	return `${artwork.title}, ${authorsOf(artwork)}`;
}

export function formatWhen(date: Date, now: Date): string {
	return relativeDays.format(daysBetween(now, date), 'day');
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
