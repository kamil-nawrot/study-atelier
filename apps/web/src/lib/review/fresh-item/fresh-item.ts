import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { withoutHeld } from '#lib/review/holds/holds.ts';
import { startOfDay } from '#lib/review/queue/queue.ts';
import { artworkIdsIn } from '#lib/review/question-skip/question-skip.ts';
import { sessionItems } from '#lib/review/quiz/quiz.ts';
import type { ResolvedImages } from '#lib/review/resolved-images/resolved-images.svelte.ts';
import {
	loadReviewDetails,
	loadSession,
	withPinPreviews
} from '#lib/review/review-data/review-data.ts';
import { withItemImages } from '#lib/review/review-images/review-images.ts';
import type { Holds } from '#lib/review/types/holds.ts';
import type { ReviewCard } from '#lib/review/types/review-card.ts';
import type { ReviewDetails } from '#lib/review/types/review-details.ts';
import type { ReviewForm } from '#lib/review/types/review-form.ts';
import type { ReviewItem } from '#lib/review/types/review-item.ts';
import type { ReviewScope } from '#lib/review/types/review-scope.ts';
import type { SessionStep } from '#lib/review/types/session-step.ts';

type FreshInput = {
	form: ReviewForm;
	scope: ReviewScope;
	freeRound?: number;
	artworksById: Map<string, WallArtwork>;
	cards: Map<string, ReviewCard>;
	holds: Holds;
	queue: readonly SessionStep[];
	images: ResolvedImages;
	now: Date;
};

export async function loadFreshItem(
	input: FreshInput
): Promise<{ item?: ReviewItem; details: Map<string, ReviewDetails> }> {
	const loaded = await loadSession(startOfDay(input.now), input.form, input.scope, input.freeRound);
	const asked = artworkIdsIn(input.queue);
	const fresh = withoutHeld(
		sessionItems(loaded.rows, input.artworksById, input.cards),
		input.holds
	);
	const [next] = await withPinPreviews(
		fresh.filter((item) => !asked.has(item.artwork.id)).slice(0, 1)
	);
	if (!next) return { details: new Map() };
	const [, found] = await Promise.all([
		input.images.resolve([next.artwork]),
		loadReviewDetails([next.artwork.id])
	]);
	return { item: withItemImages(next, input.images.withImage), details: found.details };
}
