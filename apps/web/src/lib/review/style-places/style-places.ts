import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import {
	isDueToday,
	MIN_ARTWORKS,
	newAllowance,
	reviewableArtworks,
	sessionCounts
} from '#lib/review/queue/queue.ts';
import type { Preferences } from '#lib/profile/types/preferences.ts';
import type { ReviewCounts } from '#lib/review/types/review-counts.ts';
import type { QuizMode } from '#lib/review/types/quiz-mode.ts';
import type { ReviewCard } from '#lib/review/types/review-card.ts';
import type { ReviewForm } from '#lib/review/types/review-form.ts';
import type { ReviewScope } from '#lib/review/types/review-scope.ts';
import type { SessionInput } from '#lib/review/types/session-input.ts';

export const STYLE_SHARE = 5;

type RoundPreferences = Pick<
	Preferences,
	'reviewSessionSize' | 'reviewNewPerDay' | 'reviewForm' | 'reviewQuizKinds'
>;

type StylePlacesInput = {
	artworks: WallArtwork[];
	cards: Map<string, ReviewCard>;
	styleCards: Map<string, ReviewCard>;
	now: Date;
	sessionSize: number;
	form: ReviewForm;
	scope: ReviewScope;
	quizKinds: readonly QuizMode[];
};

export function stylePlaces({
	artworks,
	cards,
	styleCards,
	now,
	sessionSize,
	form,
	scope,
	quizKinds
}: StylePlacesInput): number {
	if (form === 'flashcards' || scope.kind === 'style' || !quizKinds.includes('quiz_style'))
		return 0;
	const eligible = reviewableArtworks(artworks).filter((artwork) => {
		if (artwork.styles.length === 0 || !cards.has(artwork.id)) return false;
		const card = styleCards.get(artwork.id);
		return card === undefined || isDueToday(card, now);
	}).length;
	return Math.min(Math.floor(sessionSize / STYLE_SHARE), eligible);
}

export function plannedCounts(
	input: SessionInput & Omit<StylePlacesInput, 'sessionSize'> & { sessionSize: number }
): ReturnType<typeof sessionCounts> {
	return sessionCounts({ ...input, stylePlaces: stylePlaces(input) });
}

export function roundWaiting(counts: ReviewCounts, preferences: RoundPreferences): number {
	if (counts.withImage < MIN_ARTWORKS) return 0;
	const {
		reviewSessionSize: sessionSize,
		reviewForm: form,
		reviewQuizKinds: quizKinds
	} = preferences;
	const styled = form !== 'flashcards' && quizKinds.includes('quiz_style');
	const size =
		sessionSize -
		(styled ? Math.min(Math.floor(sessionSize / STYLE_SHARE), counts.styleWaiting) : 0);
	const known = Math.min(counts.due, size);
	const allowance = newAllowance(counts.newToday, preferences.reviewNewPerDay);
	return known + Math.min(counts.newAvailable, allowance, size - known);
}
