import { answeredArtworks } from '#lib/review/free-answers/free-answers.ts';
import { summaryGroups } from '#lib/review/overview/overview.ts';
import type { ReviewSession } from '#lib/review/review-session/review-session.svelte.ts';
import type { SessionSummary } from '#lib/review/types/session-summary.ts';

export function roundSummary(session: ReviewSession, tomorrow: number): SessionSummary {
	return {
		count: answeredArtworks(session),
		minutes: session.minutes,
		tomorrow: session.free ? 0 : tomorrow,
		groups: summaryGroups(session.answers),
		free: session.free,
		years: session.years,
		orders: session.orders
	};
}
