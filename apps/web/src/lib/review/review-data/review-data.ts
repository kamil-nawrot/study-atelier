import { failureMessage } from '#lib/auth/expired-session-data/expired-session-data.ts';
import { artworkImageCredit } from '#lib/images/artwork-image/artwork-image.ts';
import { collectionErrorMessage } from '#lib/catalogue/errors/errors.ts';
import { IMAGE_COLUMNS, imageOf, withPreview } from '#lib/images/image-record/image-record.ts';
import type { ImageRow } from '#lib/images/types/image-row.ts';
import { m } from '#lib/i18n/i18n.ts';
import { rowLimitMessage } from '#lib/shared/data/errors/errors.ts';
import { fetchAll } from '#lib/shared/data/fetch-all/fetch-all.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { noteWrite } from '#lib/shared/data/writes/writes.ts';
import type { ReviewScope } from '#lib/review/types/review-scope.ts';
import { MIN_ARTWORKS, newAllowance, startOfDay } from '#lib/review/queue/queue.ts';
import type { ReviewCard } from '#lib/review/types/review-card.ts';
import type { ReviewCounts } from '#lib/review/types/review-counts.ts';
import type { ReviewForm } from '#lib/review/types/review-form.ts';
import type { ReviewItem } from '#lib/review/types/review-item.ts';
import type { ReviewState } from '#lib/review/types/review-state.ts';
import type { SessionRow } from '#lib/review/types/session-row.ts';
import type { ReviewMode } from '#lib/review/types/review-mode.ts';
import type { ReviewRating } from '#lib/review/types/review-rating.ts';
import type { ReviewDetails } from '#lib/review/types/review-details.ts';

type ReviewSessionResult = {
	rows: SessionRow[];
	error?: string;
};

type ReviewAnswer = {
	mode: ReviewMode;
	rating: ReviewRating;
	correct?: boolean;
	answerMs?: number;
};

type ReviewCardsResult = {
	cards: Map<string, ReviewCard>;
	error?: string;
};

type ReviewCountsResult = {
	counts?: ReviewCounts;
	error?: string;
};

type ReviewStreakResult = {
	days: number;
	error?: string;
};

type RecordReviewResult = {
	error?: string;
};

type ReviewDetailsResult = {
	details: Map<string, ReviewDetails>;
	error?: string;
};

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

type DetailsRow = {
	id: string;
	notes: string | null;
	artwork_images: ImageRow[];
};

const DETAILS_COLUMNS = `id, notes, artwork_images(${IMAGE_COLUMNS.join(', ')})`;

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

export async function recordFreeAnswers(dayStart: Date, answers: number): Promise<void> {
	const { error } = await supabase.rpc('record_free_answers', {
		day_start: dayStart.toISOString(),
		answers
	});
	if (!error) noteWrite();
}

export function waitingToday(counts: ReviewCounts, newPerDay?: number): number {
	if (counts.withImage < MIN_ARTWORKS) return 0;
	const fresh = Math.min(counts.newAvailable, newAllowance(counts.newToday, newPerDay));
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
		},
		day_start: startOfDay(new Date()).toISOString(),
		time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone
	});
	if (!error) {
		noteWrite();
		return {};
	}
	return {
		error: await failureMessage(error, (failure) => rowLimitMessage(failure) ?? m.review.saveFailed)
	};
}

export async function loadReviewDetails(ids: string[]): Promise<ReviewDetailsResult> {
	if (ids.length === 0) return { details: new Map() };
	const { data, error } = await supabase
		.from('artworks')
		.select(DETAILS_COLUMNS)
		.in('id', ids)
		.eq('artwork_images.position', 0);
	if (error || !data) return { details: new Map(), error: collectionErrorMessage(error ?? {}) };
	return {
		details: new Map(
			(data as unknown as DetailsRow[]).map((row) => {
				const main = row.artwork_images[0];
				return [
					row.id,
					{ notes: row.notes ?? '', credit: artworkImageCredit(main ? imageOf(main) : null) }
				];
			})
		)
	};
}

export async function withPinPreviews(items: ReviewItem[]): Promise<ReviewItem[]> {
	return Promise.all(
		items.map(async (item) => {
			if (!item.pin) return item;
			const image = (await withPreview(item.pin.image)) ?? item.pin.image;
			return { ...item, pin: { ...item.pin, image } };
		})
	);
}

function scopeArgs(scope: ReviewScope): { scope_kind: string; scope_value?: string } {
	if (scope.kind === 'all') return { scope_kind: 'all' };
	if (scope.kind === 'era') return { scope_kind: 'era', scope_value: scope.code };
	return { scope_kind: scope.kind, scope_value: scope.name };
}

export async function loadSession(
	dayStart: Date,
	form: ReviewForm,
	scope: ReviewScope,
	freeRound?: number
): Promise<ReviewSessionResult> {
	const { data, error } = await supabase.rpc('review_session', {
		day_start: dayStart.toISOString(),
		session_form: form,
		...scopeArgs(scope),
		...(freeRound === undefined ? {} : { free_round: freeRound })
	});
	if (error || !Array.isArray(data)) {
		return { rows: [], error: await failureMessage(error ?? {}, collectionErrorMessage) };
	}
	return { rows: data as unknown as SessionRow[] };
}
