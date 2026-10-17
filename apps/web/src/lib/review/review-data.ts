import { failureMessage } from '#lib/auth/expired-session.svelte.ts';
import { artworkImageCredit } from '#lib/collection/artwork-image.ts';
import { fetchAll } from '#lib/collection/card-index-data.ts';
import { collectionErrorMessage } from '#lib/collection/errors.ts';
import { IMAGE_COLUMNS, type ImageRow, imageOf } from '#lib/collection/image-record.ts';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/supabase.ts';
import type { ReviewScope } from './overview.ts';
import { MIN_ARTWORKS, newAllowance } from './queue.ts';
import type {
	RecordReviewResult,
	ReviewAnswer,
	ReviewCard,
	ReviewCardsResult,
	ReviewCounts,
	ReviewCountsResult,
	ReviewDetailsResult,
	ReviewForm,
	ReviewSessionResult,
	ReviewState,
	ReviewStreakResult,
	SessionRow
} from './types.ts';

type CardRow = {
	artwork_id: string;
	due: string;
	stability: number;
	difficulty: number;
	state: number;
	reps: number;
	lapses: number;
	scheduled_days: number;
	learning_steps: number;
	last_review: string | null;
};

type CountsRow = {
	due: number;
	new_available: number;
	new_today: number;
	with_image: number;
};

type DetailsRow = ImageRow & {
	id: string;
	notes: string | null;
};

const DETAILS_COLUMNS = ['id', 'notes', ...IMAGE_COLUMNS].join(', ');

export const REVIEW_COUNTS_DEPENDENCY = 'review:counts';

const CARD_COLUMNS =
	'artwork_id, due, stability, difficulty, state, reps, lapses, scheduled_days, learning_steps, last_review';

function reviewCard(row: CardRow): ReviewCard {
	return {
		artworkId: row.artwork_id,
		due: new Date(row.due),
		stability: row.stability,
		difficulty: row.difficulty,
		state: row.state as ReviewState,
		reps: row.reps,
		lapses: row.lapses,
		scheduledDays: row.scheduled_days,
		learningSteps: row.learning_steps,
		lastReview: row.last_review ? new Date(row.last_review) : null
	};
}

export async function loadReviewCards(): Promise<ReviewCardsResult> {
	const { rows, error } = await fetchAll<CardRow>((from, to) =>
		supabase.from('review_cards').select(CARD_COLUMNS).order('artwork_id').range(from, to)
	);
	if (error) return { cards: new Map(), error: collectionErrorMessage(error) };
	return { cards: new Map(rows.map((row) => [row.artwork_id, reviewCard(row)])) };
}

export async function loadReviewCounts(dayStart: Date): Promise<ReviewCountsResult> {
	const { data, error } = await supabase
		.rpc('review_counts', { day_start: dayStart.toISOString() })
		.single();
	if (error || !data) return { error: collectionErrorMessage(error ?? {}) };
	const row = data as CountsRow;
	return {
		counts: {
			due: row.due,
			newAvailable: row.new_available,
			newToday: row.new_today,
			withImage: row.with_image
		}
	};
}

export async function loadReviewStreak(dayStart: Date): Promise<ReviewStreakResult> {
	const { data, error } = await supabase.rpc('review_streak', {
		day_start: dayStart.toISOString(),
		time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone
	});
	if (error || typeof data !== 'number') {
		return { days: 0, error: collectionErrorMessage(error ?? {}) };
	}
	return { days: data };
}

export function waitingToday(counts: ReviewCounts): number {
	if (counts.withImage < MIN_ARTWORKS) return 0;
	const fresh = Math.min(counts.newAvailable, newAllowance(counts.newToday));
	return counts.due + fresh;
}

export async function recordReview(
	card: ReviewCard,
	answer: ReviewAnswer
): Promise<RecordReviewResult> {
	const { error } = await supabase.rpc('record_review', {
		target_artwork: card.artworkId,
		card: {
			due: card.due.toISOString(),
			stability: card.stability,
			difficulty: card.difficulty,
			state: card.state,
			reps: card.reps,
			lapses: card.lapses,
			scheduled_days: card.scheduledDays,
			learning_steps: card.learningSteps,
			last_review: card.lastReview?.toISOString() ?? null
		},
		answer: {
			mode: answer.mode,
			rating: answer.rating,
			correct: answer.mode === 'flashcard' ? null : (answer.correct ?? false),
			answer_ms: answer.answerMs === undefined ? null : Math.round(answer.answerMs)
		}
	});
	return error ? { error: await failureMessage(error, () => m.review.saveFailed) } : {};
}

export async function loadReviewDetails(ids: string[]): Promise<ReviewDetailsResult> {
	if (ids.length === 0) return { details: new Map() };
	const { data, error } = await supabase.from('artworks').select(DETAILS_COLUMNS).in('id', ids);
	if (error || !data) return { details: new Map(), error: collectionErrorMessage(error ?? {}) };
	return {
		details: new Map(
			(data as unknown as DetailsRow[]).map((row) => [
				row.id,
				{ notes: row.notes ?? '', credit: artworkImageCredit(imageOf(row)) }
			])
		)
	};
}

function scopeArgs(scope: ReviewScope): { scope_kind: string; scope_value?: string } {
	if (scope.kind === 'all') return { scope_kind: 'all' };
	if (scope.kind === 'era') return { scope_kind: 'era', scope_value: scope.code };
	return { scope_kind: scope.kind, scope_value: scope.name };
}

export async function loadSession(
	dayStart: Date,
	form: ReviewForm,
	scope: ReviewScope
): Promise<ReviewSessionResult> {
	const { data, error } = await supabase.rpc('review_session', {
		day_start: dayStart.toISOString(),
		session_form: form,
		...scopeArgs(scope)
	});
	if (error || !Array.isArray(data)) {
		return { rows: [], error: await failureMessage(error ?? {}, collectionErrorMessage) };
	}
	return { rows: data as unknown as SessionRow[] };
}
