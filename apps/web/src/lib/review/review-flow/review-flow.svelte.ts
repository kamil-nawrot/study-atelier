import { invalidate } from '$app/navigation';
import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
import { m } from '#lib/i18n/i18n.ts';
import {
	atelierKnowledge,
	freeScopeOptions,
	nextWaiting,
	sameScope,
	scopeArtworks,
	scopeOptions,
	troubles,
	waitingTomorrow
} from '#lib/review/overview/overview.ts';
import { FreeAnswers } from '#lib/review/free-answers/free-answers.ts';
import { loadExtraSteps } from '#lib/review/extra-steps/extra-steps.ts';
import { roundSummary } from '#lib/review/round-summary/round-summary.ts';
import { offeredForms, quizzesPossible } from '#lib/review/forms/forms.ts';
import {
	currentDate,
	missingArtworks,
	startOfDay,
	withExtraSteps
} from '#lib/review/queue/queue.ts';
import { quizArtworks, sessionItems } from '#lib/review/quiz/quiz.ts';
import {
	loadSession,
	REVIEW_COUNTS_DEPENDENCY,
	withPinPreviews
} from '#lib/review/review-data/review-data.ts';
import { preloadSteps, withItemImages } from '#lib/review/review-images/review-images.ts';
import { reviewedSince, streakWithToday } from '#lib/review/streak-week/streak-week.ts';
import { ResolvedImages } from '#lib/review/resolved-images/resolved-images.svelte.ts';
import { ReviewStop } from '#lib/review/review-stop/review-stop.svelte.ts';
import { ReviewSession } from '#lib/review/review-session/review-session.svelte.ts';
import { plannedCounts } from '#lib/review/style-places/style-places.ts';
import type { ReviewCard } from '#lib/review/types/review-card.ts';
import type { ReviewDetails } from '#lib/review/types/review-details.ts';
import type { ReviewForm } from '#lib/review/types/review-form.ts';
import type { ReviewRating } from '#lib/review/types/review-rating.ts';
import type { ReviewScope } from '#lib/review/types/review-scope.ts';
import type { ReviewSource } from '#lib/review/types/review-source.ts';
import type { ScopeChoice } from '#lib/review/types/scope-choice.ts';
import type { SessionSummary } from '#lib/review/types/session-summary.ts';
import { reportError } from '#lib/shared/monitoring/monitoring.ts';
import { timeArtworks, timeQuestions } from '#lib/review/time-questions/time-questions.ts';

const PRELOAD_AHEAD = 2;
const ALL_SCOPE: ReviewScope = { kind: 'all' };

function mapOf<K, V>(entries: Iterable<readonly [K, V]> = []): Map<K, V> {
	return new Map(entries);
}

export class ReviewFlow {
	scope = $state<ReviewScope>(ALL_SCOPE);
	form = $state<ReviewForm>('mixed');
	freeRound = $state(0);
	cards = $state.raw(mapOf<string, ReviewCard>());
	styleCards = $state.raw(mapOf<string, ReviewCard>());
	newToday = $state(0);
	now = $state(currentDate());
	phase = $state<'start' | 'session' | 'summary'>('start');
	session = $state<ReviewSession>();
	summary = $state<SessionSummary>();
	starting = $state(false);
	startError = $state<string>();
	details = $state.raw(mapOf<string, ReviewDetails>());
	readonly images = new ResolvedImages();
	readonly stop = new ReviewStop(
		() => this.session,
		() => this.#finish()
	);

	#free = new FreeAnswers();
	#outcomes = $state<Record<ReviewRating, ReviewCard>>();
	readonly #source: () => ReviewSource;

	constructor(source: () => ReviewSource) {
		this.#source = source;
		const data = source();
		this.form = data.preferences.reviewForm;
		this.cards = data.cards;
		this.styleCards = data.styleCards;
		this.newToday = data.newToday;
	}

	#data(): ReviewSource {
		return this.#source();
	}

	forms = $derived(
		offeredForms(
			quizzesPossible(
				this.#data().preferences.reviewQuizKinds,
				this.#data().artworks,
				this.#data().termPins
			)
		)
	);
	activeForm = $derived(this.forms.includes(this.form) ? this.form : 'mixed');
	limits = $derived({
		sessionSize: this.#data().preferences.reviewSessionSize,
		newPerDay: this.#data().preferences.reviewNewPerDay
	});
	allCounts = $derived(this.#counts(scopeArtworks(this.#data().artworks, ALL_SCOPE), ALL_SCOPE));
	freeScopes = $derived(freeScopeOptions(this.#data().artworks, this.cards));
	freeOpen = $derived(
		this.#data().preferences.reviewFree &&
			this.allCounts.known + this.allCounts.fresh === 0 &&
			missingArtworks(scopeArtworks(this.#data().artworks, ALL_SCOPE)) === 0 &&
			this.freeScopes.length > 0
	);
	scopes = $derived<ScopeChoice[]>(
		this.freeOpen
			? this.freeScopes
			: scopeOptions(this.#data().artworks, this.cards, this.now).map((option) => {
					const planned = this.#counts(scopeArtworks(this.#data().artworks, option), option);
					return { scope: option, count: planned.known + planned.fresh };
				})
	);
	activeScope = $derived(
		this.scopes.find((option) => sameScope(option.scope, this.scope))?.scope ?? ALL_SCOPE
	);
	scoped = $derived(scopeArtworks(this.#data().artworks, this.activeScope));
	counts = $derived(this.#counts(this.scoped, this.activeScope));
	waiting = $derived(this.counts.known + this.counts.fresh);
	missing = $derived(missingArtworks(this.scoped));
	nextDate = $derived(
		this.waiting === 0 && this.missing === 0 ? nextWaiting(this.scoped, this.cards, this.now) : null
	);
	artworksById = $derived(mapOf(this.#data().artworks.map((artwork) => [artwork.id, artwork])));
	knowledge = $derived(atelierKnowledge(this.#data().artworks, this.cards));
	reviewedToday = $derived(reviewedSince(this.cards.values(), startOfDay(this.now)));
	streak = $derived(streakWithToday(this.#data(), this.reviewedToday, startOfDay(this.now)));
	hard = $derived(troubles(this.#data().artworks, this.cards).map(this.images.withImage));
	current = $derived(this.session?.current);

	#counts(artworks: WallArtwork[], scope: ReviewScope): ReturnType<typeof plannedCounts> {
		return plannedCounts({
			...this.limits,
			artworks,
			scope,
			cards: this.cards,
			styleCards: this.styleCards,
			now: this.now,
			newToday: this.newToday,
			form: this.activeForm,
			quizKinds: this.#data().preferences.reviewQuizKinds
		});
	}

	follow(): void {
		this.images.follow(() => troubles(this.#data().artworks, this.cards));

		$effect(() => {
			const session = this.session;
			if (!session) return;
			preloadSteps(session.queue.slice(session.position + 1, session.position + 1 + PRELOAD_AHEAD));
		});

		$effect(() => {
			void this.session?.position;
			window.scrollTo(0, 0);
		});
	}

	chooseScope(scope: ReviewScope): void {
		this.scope = scope;
		this.freeRound = 0;
	}

	async start(): Promise<void> {
		if (this.starting) return;
		this.starting = true;
		this.startError = undefined;
		try {
			this.startError = await this.#prepareSession();
		} catch (error) {
			reportError(error);
			this.startError = m.common.unexpectedError;
		}
		if (this.startError || !this.session) {
			this.now = currentDate();
			this.phase = 'start';
		}
		this.starting = false;
	}

	async #prepareSession(): Promise<string | undefined> {
		const free = this.freeOpen;
		const { reviewTimeQuestions } = this.#data().preferences;
		const loaded = await loadSession(
			startOfDay(currentDate()),
			this.activeForm,
			this.activeScope,
			reviewTimeQuestions,
			free ? this.freeRound : undefined
		);
		const items = await withPinPreviews(sessionItems(loaded.rows, this.artworksById, this.cards));
		if (loaded.error || items.length === 0) return loaded.error;
		const times = timeQuestions(loaded.rows, this.artworksById, currentDate());
		const artworks = [...items.map((item) => item.artwork), ...timeArtworks(times)];
		const shown = [...artworks, ...quizArtworks(items)];
		const extras = await loadExtraSteps({
			preferences: this.#data().preferences,
			glossary: this.#data().glossary,
			scope: this.activeScope,
			asked: artworks,
			shown,
			atelier: this.#data().artworks,
			artworksById: this.artworksById,
			images: this.images,
			times
		});
		if (extras.error) return extras.error;
		this.details = extras.details;
		if (free) this.freeRound += 1;
		this.#free = new FreeAnswers();
		this.session = new ReviewSession(
			withExtraSteps(
				items.map((item) => withItemImages(item, this.images.withImage)),
				extras.steps
			),
			this.cards,
			undefined,
			undefined,
			free
		);
		this.summary = undefined;
		this.phase = 'session';
		return undefined;
	}

	reveal(): void {
		if (!this.session) return;
		this.#outcomes = this.session.next();
		this.session.reveal();
	}

	async rate(rating: ReviewRating): Promise<void> {
		const active = this.session;
		if (!active) return;
		await active.rate(rating, this.#outcomes?.[rating]);
		this.#free.record(active, startOfDay(currentDate()));
		if (active === this.session && (active.finished || this.stop.afterSave)) this.#finish();
	}

	async answer(choice: number): Promise<void> {
		await this.#quizAnswer((active) => active.answer(choice));
	}

	async typeTitle(picked: readonly string[]): Promise<void> {
		await this.#quizAnswer((active) => active.typeTitle(picked));
	}

	async #quizAnswer(act: (active: ReviewSession) => Promise<void>): Promise<void> {
		const active = this.session;
		if (!active) return;
		await act(active);
		this.#free.record(active, startOfDay(currentDate()));
		if (active === this.session && this.stop.afterSave) this.#finish();
	}

	async guess(year: number): Promise<void> {
		const active = this.session;
		if (!active) return;
		await active.guess(year);
		if (active === this.session && this.stop.afterSave) this.#finish();
	}

	proceed(): void {
		if (!this.session) return;
		this.session.proceed();
		if (this.session.finished) this.#finish();
	}

	#finish(): void {
		this.stop.reset();
		const session = this.session;
		if (!session) return;
		if (!session.free) {
			this.cards = mapOf(session.cards);
			this.styleCards = mapOf([...this.styleCards, ...session.styleCards]);
			this.newToday += session.started;
		}
		this.now = currentDate();
		this.#free.record(session, startOfDay(this.now));
		this.summary = roundSummary(
			session,
			session.free ? 0 : waitingTomorrow(this.scoped, this.cards, this.now, this.limits)
		);
		if (!session.free) void invalidate(REVIEW_COUNTS_DEPENDENCY);
		this.session = undefined;
		this.phase = session.anyAnswer ? 'summary' : 'start';
	}
}
