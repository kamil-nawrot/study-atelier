import { eraYears } from '#lib/catalogue/eras/eras.ts';
import { yearsBetween } from '#lib/catalogue/years/years.ts';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import type { ReviewCard } from '#lib/review/types/review-card.ts';
import type { ReviewRating } from '#lib/review/types/review-rating.ts';
import type { ReviewState } from '#lib/review/types/review-state.ts';
import type { SessionCardRow } from '#lib/review/types/session-card-row.ts';
import type { SessionRow } from '#lib/review/types/session-row.ts';
import type { YearItem } from '#lib/review/types/year-item.ts';
import type { YearOutcome } from '#lib/review/types/year-outcome.ts';

export type Years = [number, number];

const KNOW_SHARE = 0.05;
const CLOSE_SHARE = 0.15;
const PAGE_SHARE = 0.1;

export function yearsOf(artwork: WallArtwork): Years | null {
	const first = artwork.yearFrom ?? artwork.yearTo;
	const last = artwork.yearTo ?? artwork.yearFrom;
	return first === null || last === null ? null : [first, last];
}

export function boundsOf(artwork: WallArtwork, today: Date): Years | null {
	return artwork.eraCode ? eraYears(artwork.eraCode, today) : null;
}

function eraLength([start, end]: Years): number {
	return yearsBetween(start, end);
}

export function withoutZero(year: number, previous: number): number {
	if (year !== 0) return year;
	return previous < 0 ? 1 : -1;
}

export function sliderStart(bounds: Years): number {
	const middle = Math.round((bounds[0] + bounds[1]) / 2);
	return withoutZero(middle, bounds[0]);
}

export function pageStep(bounds: Years): number {
	return Math.max(1, Math.round(eraLength(bounds) * PAGE_SHARE));
}

export function stepYear(year: number, by: number, bounds: Years): number {
	const moved = Math.min(bounds[1], Math.max(bounds[0], year + by));
	return withoutZero(moved, year);
}

export function yearOutcome(guess: number, years: Years, bounds: Years): YearOutcome {
	const [first, last] = years;
	const direction = guess < first ? 'early' : guess > last ? 'late' : 'inside';
	const miss =
		direction === 'early'
			? yearsBetween(guess, first)
			: direction === 'late'
				? yearsBetween(last, guess)
				: 0;
	const length = eraLength(bounds);
	const rating: ReviewRating =
		miss <= length * KNOW_SHARE ? 3 : miss <= length * CLOSE_SHARE ? 2 : 1;
	return { rating, miss, direction };
}

function clamp(value: number, bounds: Years): number {
	return Math.min(bounds[1], Math.max(bounds[0], value));
}

export function band(years: Years, bounds: Years, share: 'know' | 'close'): Years {
	const reach = eraLength(bounds) * (share === 'know' ? KNOW_SHARE : CLOSE_SHARE);
	return [clamp(years[0] - reach, bounds), clamp(years[1] + reach, bounds)];
}

export function placeOf(year: number, bounds: Years): number {
	const span = bounds[1] - bounds[0];
	return span === 0 ? 0 : (clamp(year, bounds) - bounds[0]) / span;
}

function cardOf(artworkId: string, row: SessionCardRow): ReviewCard {
	return {
		artworkId,
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

export function yearItems(
	rows: SessionRow[],
	artworks: Map<string, WallArtwork>,
	today: Date
): YearItem[] {
	return rows.flatMap((row): YearItem[] => {
		if (row.mode !== 'year') return [];
		const artwork = artworks.get(row.artwork_id);
		if (!artwork || !yearsOf(artwork) || !boundsOf(artwork, today)) return [];
		const card = row.card ? cardOf(row.artwork_id, row.card) : null;
		return [{ mode: 'year', artwork, card }];
	});
}
