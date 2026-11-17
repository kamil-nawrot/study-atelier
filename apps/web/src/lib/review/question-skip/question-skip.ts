import { heldStep, withoutHeld } from '#lib/review/holds/holds.ts';
import { artworkItem, extraKey, extraQuiz } from '#lib/review/step-kinds/step-kinds.ts';
import type { Holds } from '#lib/review/types/holds.ts';
import type { ReviewItem } from '#lib/review/types/review-item.ts';
import type { SessionStep } from '#lib/review/types/session-step.ts';

type SkipContext = {
	reserve: readonly SessionStep[];
	queue: readonly SessionStep[];
	fresh: () => Promise<ReviewItem | undefined>;
};

export function artworkIdsIn(steps: readonly SessionStep[]): Set<string> {
	return new Set(
		steps.flatMap((step) =>
			step.mode === 'order'
				? step.artworks.map((artwork) => artwork.id)
				: 'artwork' in step
					? [step.artwork.id]
					: []
		)
	);
}

function fromReserve(
	step: SessionStep,
	context: SkipContext,
	holds: Holds
): SessionStep | undefined {
	const asked = new Set(context.queue.filter(extraQuiz).map(extraKey));
	return withoutHeld(context.reserve, holds).find(
		(candidate) =>
			candidate.mode === step.mode && extraQuiz(candidate) && !asked.has(extraKey(candidate))
	);
}

export async function skipReplacement(
	step: SessionStep,
	holds: Holds,
	context: SkipContext
): Promise<SessionStep | undefined> {
	const kept = heldStep(step, holds);
	if (kept && kept !== step) return kept;
	if (step.mode === 'quiz_definition' || step.mode === 'quiz_symbol') {
		return fromReserve(step, context, holds);
	}
	const whole = [...artworkIdsIn([step])].some((id) => holds.artworks.has(id));
	return whole && (artworkItem(step) || step.mode === 'year') ? context.fresh() : undefined;
}

export function skippedQueue(
	queue: readonly SessionStep[],
	position: number,
	replacement: SessionStep | undefined,
	holds: Holds
): SessionStep[] {
	return [
		...queue.slice(0, position),
		...(replacement ? [replacement] : []),
		...withoutHeld(queue.slice(position + 1), holds)
	];
}
