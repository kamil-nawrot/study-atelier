import { recordFreeAnswers } from '#lib/review/review-data/review-data.ts';
import type { ReviewSession } from '#lib/review/review-session/review-session.svelte.ts';

export function answeredArtworks(session: ReviewSession): number {
	return new Set(session.answers.map((answer) => answer.item.artwork.id)).size;
}

export class FreeAnswers {
	#recorded = 0;

	record(session: ReviewSession, dayStart: Date): void {
		if (!session.free) return;
		const answered = answeredArtworks(session);
		if (answered <= this.#recorded) return;
		void recordFreeAnswers(dayStart, answered - this.#recorded);
		this.#recorded = answered;
	}
}
