import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { ReviewCard, ReviewItem } from '#lib/review/types.ts';

export const SESSION_SIZE = 20;
export const NEW_PER_DAY = 10;
export const MIN_ARTWORKS = 20;
export const SETTLED_STABILITY_DAYS = 7;
export const RETRY_GAP_MIN = 3;
export const RETRY_GAP_MAX = 5;

export type SessionInput = {
	artworks: WallArtwork[];
	cards: Map<string, ReviewCard>;
	now: Date;
	newToday: number;
	sessionSize?: number;
	newPerDay?: number;
};

export type SessionCounts = {
	known: number;
	fresh: number;
};

export function currentDate(): Date {
	return new Date();
}

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

export function newAllowance(newToday: number, newPerDay: number = NEW_PER_DAY): number {
	return Math.max(0, newPerDay - newToday);
}

export function isDueToday(card: ReviewCard, now: Date): boolean {
	return card.due < endOfDay(now);
}

export function sessionCounts({
	artworks,
	cards,
	now,
	newToday,
	sessionSize = SESSION_SIZE,
	newPerDay = NEW_PER_DAY
}: SessionInput): SessionCounts {
	const pool = reviewableArtworks(artworks);
	if (pool.length < MIN_ARTWORKS) return { known: 0, fresh: 0 };
	const due = pool.filter((artwork) => {
		const card = cards.get(artwork.id);
		return card !== undefined && isDueToday(card, now);
	}).length;
	const known = Math.min(due, sessionSize);
	const unseen = pool.filter((artwork) => !cards.has(artwork.id)).length;
	return { known, fresh: Math.min(unseen, newAllowance(newToday, newPerDay), sessionSize - known) };
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
