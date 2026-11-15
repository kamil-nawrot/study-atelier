import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { endOfDay, MIN_ARTWORKS } from '#lib/review/queue/queue.ts';
import type { ReviewCard } from '#lib/review/types/review-card.ts';
import type { ReviewPlan } from '#lib/review/types/review-plan.ts';

type PlanLimits = { newToday?: number; sessionSize?: number; newPerDay?: number; now?: Date };

export function testReviewPlan(
	artworks: WallArtwork[],
	cards: Map<string, ReviewCard>,
	{ newToday = 0, sessionSize = 20, newPerDay = 10, now = new Date() }: PlanLimits = {}
): ReviewPlan {
	const pool = artworks.filter((artwork) => artwork.hasImage);
	const enough = pool.length >= MIN_ARTWORKS;
	const due = pool.filter((artwork) => {
		const card = cards.get(artwork.id);
		return card !== undefined && card.due < endOfDay(now);
	}).length;
	const unseen = pool.filter((artwork) => !cards.has(artwork.id)).length;
	const known = enough ? Math.min(due, sessionSize) : 0;
	const fresh = enough
		? Math.min(unseen, Math.max(0, newPerDay - newToday), sessionSize - known)
		: 0;
	const reviewed = pool.filter((artwork) => cards.has(artwork.id)).length;
	return {
		scopes: [{ scope: { kind: 'all' }, known, fresh, artworks: pool.length }],
		free: reviewed > 0 ? [{ scope: { kind: 'all' }, count: reviewed }] : [],
		tomorrow: 0
	};
}
