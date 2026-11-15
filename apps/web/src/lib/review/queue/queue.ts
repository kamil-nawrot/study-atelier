import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { ReviewItem } from '#lib/review/types/review-item.ts';
import type { SessionStep } from '#lib/review/types/session-step.ts';

export const MIN_ARTWORKS = 20;
export const SETTLED_STABILITY_DAYS = 7;
export const RETRY_GAP_MIN = 3;
export const RETRY_GAP_MAX = 5;

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

export function retryLater<T>(
	queue: T[],
	position: number,
	item: T,
	random: () => number = Math.random
): T[] {
	const span = RETRY_GAP_MAX - RETRY_GAP_MIN + 1;
	const gap = RETRY_GAP_MIN + Math.min(span - 1, Math.floor(random() * span));
	const index = Math.min(position + 1 + gap, queue.length);
	return [...queue.slice(0, index), item, ...queue.slice(index)];
}

export function withExtraSteps(
	items: ReviewItem[],
	extras: SessionStep[],
	random: () => number = Math.random
): SessionStep[] {
	if (items.length === 0) return items;
	return extras.reduce<SessionStep[]>((steps, extra) => {
		const index = 1 + Math.min(steps.length - 1, Math.floor(random() * steps.length));
		return [...steps.slice(0, index), extra, ...steps.slice(index)];
	}, items);
}
