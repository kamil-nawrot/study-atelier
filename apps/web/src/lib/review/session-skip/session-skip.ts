import { loadItemFlags } from '#lib/backroom/backroom-data/backroom-data.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { loadFreshItem } from '#lib/review/fresh-item/fresh-item.ts';
import { holdsOf, NO_HOLDS } from '#lib/review/holds/holds.ts';
import { currentDate } from '#lib/review/queue/queue.ts';
import { skippedQueue, skipReplacement } from '#lib/review/question-skip/question-skip.ts';
import type { ResolvedImages } from '#lib/review/resolved-images/resolved-images.svelte.ts';
import type { ReviewSession } from '#lib/review/review-session/review-session.svelte.ts';
import type { Holds } from '#lib/review/types/holds.ts';
import type { ReviewCard } from '#lib/review/types/review-card.ts';
import type { ReviewDetails } from '#lib/review/types/review-details.ts';
import type { ReviewForm } from '#lib/review/types/review-form.ts';
import type { ReviewScope } from '#lib/review/types/review-scope.ts';
import type { SessionStep } from '#lib/review/types/session-step.ts';

type SkipContext = {
	activeForm: ReviewForm;
	activeScope: ReviewScope;
	freeRound: number;
	artworksById: Map<string, WallArtwork>;
	cards: Map<string, ReviewCard>;
	images: ResolvedImages;
};

export class SessionSkip {
	holds: Holds = NO_HOLDS;
	reserve: SessionStep[] = [];
	readonly #context: () => SkipContext;

	constructor(context: () => SkipContext) {
		this.#context = context;
	}

	async loadHolds(): Promise<Holds> {
		this.holds = holdsOf(await loadItemFlags().catch(() => []));
		return this.holds;
	}

	async skip(
		session: ReviewSession,
		ondetails: (details: Map<string, ReviewDetails>) => void
	): Promise<void> {
		const step = session.current;
		if (!step) return;
		const holds = await this.loadHolds();
		const replacement = await skipReplacement(step, holds, {
			reserve: this.reserve,
			queue: session.queue,
			fresh: async () => {
				const context = this.#context();
				const found = await loadFreshItem({
					form: context.activeForm,
					scope: context.activeScope,
					freeRound: session.free ? Math.max(0, context.freeRound - 1) : undefined,
					artworksById: context.artworksById,
					cards: context.cards,
					images: context.images,
					holds,
					queue: session.queue,
					now: currentDate()
				});
				ondetails(found.details);
				return found.item;
			}
		});
		session.replaceCurrent(skippedQueue(session.queue, session.position, replacement, holds));
	}
}
