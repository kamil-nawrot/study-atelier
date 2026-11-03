import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { ReviewCard } from '#lib/review/types/review-card.ts';

const LISTED = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

export type CountedArtwork = { artwork: WallArtwork; count: number };

export function mostForgotten(
	artworks: readonly WallArtwork[],
	cards: ReadonlyMap<string, ReviewCard>
): CountedArtwork[] {
	return artworks
		.flatMap((artwork) => {
			const lapses = cards.get(artwork.id)?.lapses ?? 0;
			return lapses > 0 ? [{ artwork, count: lapses }] : [];
		})
		.sort((a, b) => b.count - a.count || a.artwork.number - b.artwork.number)
		.slice(0, LISTED);
}

export function mostReviewed(
	artworks: readonly WallArtwork[],
	reviewed: readonly { artworkId: string; times: number }[]
): CountedArtwork[] {
	const byId = new Map(artworks.map((artwork) => [artwork.id, artwork]));
	return reviewed.flatMap((item) => {
		const artwork = byId.get(item.artworkId);
		return artwork ? [{ artwork, count: item.times }] : [];
	});
}

export function mostStable(
	artworks: readonly WallArtwork[],
	cards: ReadonlyMap<string, ReviewCard>,
	now: Date
): { artwork: WallArtwork; days: number } | undefined {
	let best: { artwork: WallArtwork; card: ReviewCard } | undefined;
	for (const artwork of artworks) {
		const card = cards.get(artwork.id);
		if (!card) continue;
		if (!best || card.stability > best.card.stability) best = { artwork, card };
	}
	if (!best) return undefined;
	return {
		artwork: best.artwork,
		days: Math.max(0, Math.ceil((best.card.due.getTime() - now.getTime()) / DAY_MS))
	};
}
