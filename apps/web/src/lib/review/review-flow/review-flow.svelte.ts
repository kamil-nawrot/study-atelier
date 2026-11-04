import { untrack } from 'svelte';
import { invalidate } from '$app/navigation';
import { resolveImages } from '#lib/wall/wall-data/wall-data.ts';
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
import { roundSummary } from '#lib/review/round-summary/round-summary.ts';
import {
	definitionItems,
	definitionsOffered,
	drawnTerms,
	withDefinitionsOf
} from '#lib/review/definitions/definitions.ts';
import { loadTermDefinitions } from '#lib/glossary/glossary-data/glossary-data.ts';
import { offeredForms, quizzesPossible } from '#lib/review/forms/forms.ts';
import {
	missingArtworks,
	sessionCounts,
	startOfDay,
	withExtraSteps
} from '#lib/review/queue/queue.ts';
import { quizArtworks, sessionItems } from '#lib/review/quiz/quiz.ts';
import {
	loadReviewDetails,
	loadSession,
	REVIEW_COUNTS_DEPENDENCY,
	withPinPreviews
} from '#lib/review/review-data/review-data.ts';
import { preloadSteps, withItemImages } from '#lib/review/review-images/review-images.ts';
import { ReviewStop } from '#lib/review/review-stop/review-stop.svelte.ts';
import { ReviewSession } from '#lib/review/review-session/review-session.svelte.ts';
import type { ReviewCard } from '#lib/review/types/review-card.ts';
import type { ReviewDetails } from '#lib/review/types/review-details.ts';
import type { ReviewForm } from '#lib/review/types/review-form.ts';
import type { ReviewRating } from '#lib/review/types/review-rating.ts';
import type { ReviewScope } from '#lib/review/types/review-scope.ts';
import type { ReviewSource } from '#lib/review/types/review-source.ts';
import type { ScopeChoice } from '#lib/review/types/scope-choice.ts';
import type { SessionSummary } from '#lib/review/types/session-summary.ts';
import { reportError } from '#lib/shared/monitoring/monitoring.ts';
import {
	timeArtworks,
	timeQuestions,
	withTimeImages
} from '#lib/review/time-questions/time-questions.ts';

const PRELOAD_AHEAD = 2;
const ALL_SCOPE: ReviewScope = { kind: 'all' };

function currentDate(): Date {
	return new Date();
}

function mapOf<K, V>(entries: Iterable<readonly [K, V]> = []): Map<K, V> {
	return new Map(entries);
}

export class ReviewFlow {
	scope = $state<ReviewScope>(ALL_SCOPE);
	form = $state<ReviewForm>('mixed');
	freeRound = $state(0);
	definitions = $state(true);
	cards = $state.raw(mapOf<string, ReviewCard>());
	newToday = $state(0);
	now = $state(currentDate());
	phase = $state<'start' | 'session' | 'summary'>('start');
	session = $state<ReviewSession>();
	summary = $state<SessionSummary>();
	starting = $state(false);
	startError = $state<string>();
	details = $state.raw(mapOf<string, ReviewDetails>());
	readonly stop = new ReviewStop(
		() => this.session,
		() => this.#finish()
	);

	#free = new FreeAnswers();
	#resolved = $state.raw(mapOf<string, WallArtwork>());
	#outcomes = $state<Record<ReviewRating, ReviewCard>>();
	readonly #source: () => ReviewSource;

	constructor(source: () => ReviewSource) {
		this.#source = source;
		const data = source();
		this.form = data.preferences.reviewForm;
		this.cards = data.cards;
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
	definitionCount = $derived(
		definitionsOffered(this.#data().glossary)
			? this.#data().preferences.reviewGlossaryQuestions
			: undefined
	);
	activeForm = $derived(this.forms.includes(this.form) ? this.form : 'mixed');
	limits = $derived({
		sessionSize: this.#data().preferences.reviewSessionSize,
		newPerDay: this.#data().preferences.reviewNewPerDay
	});
	allCounts = $derived(this.#counts(scopeArtworks(this.#data().artworks, ALL_SCOPE)));
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
					const planned = this.#counts(scopeArtworks(this.#data().artworks, option));
					return { scope: option, count: planned.known + planned.fresh };
				})
	);
	activeScope = $derived(
		this.scopes.find((option) => sameScope(option.scope, this.scope))?.scope ?? ALL_SCOPE
	);
	scoped = $derived(scopeArtworks(this.#data().artworks, this.activeScope));
	counts = $derived(this.#counts(this.scoped));
	waiting = $derived(this.counts.known + this.counts.fresh);
	missing = $derived(missingArtworks(this.scoped));
	nextDate = $derived(
		this.waiting === 0 && this.missing === 0 ? nextWaiting(this.scoped, this.cards, this.now) : null
	);
	artworksById = $derived(mapOf(this.#data().artworks.map((artwork) => [artwork.id, artwork])));
	knowledge = $derived(atelierKnowledge(this.#data().artworks, this.cards));
	hard = $derived(
		troubles(this.#data().artworks, this.cards).map((artwork) => this.withImage(artwork))
	);
	current = $derived(this.session?.current);

	#counts(artworks: WallArtwork[]): ReturnType<typeof sessionCounts> {
		return sessionCounts({
			artworks,
			cards: this.cards,
			now: this.now,
			newToday: this.newToday,
			...this.limits
		});
	}

	follow(): void {
		$effect(() => {
			const pending = troubles(this.#data().artworks, this.cards).filter(
				(artwork) => artwork.pendingImage && !untrack(() => this.#resolved.has(artwork.id))
			);
			if (pending.length > 0) void this.#resolveInto(pending);
		});

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

	withImage(artwork: WallArtwork): WallArtwork {
		return this.#resolved.get(artwork.id) ?? artwork;
	}

	async #resolveInto(artworks: WallArtwork[]): Promise<void> {
		const found = await resolveImages(artworks);
		if (found.length === 0) return;
		this.#resolved = mapOf([
			...this.#resolved,
			...found.map((artwork) => [artwork.id, artwork] as const)
		]);
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
		const dayStart = startOfDay(currentDate());
		const loaded = free
			? await loadSession(dayStart, this.activeForm, this.activeScope, this.freeRound)
			: await loadSession(dayStart, this.activeForm, this.activeScope);
		const items = await withPinPreviews(sessionItems(loaded.rows, this.artworksById, this.cards));
		if (loaded.error || items.length === 0) return loaded.error;
		const times = timeQuestions(loaded.rows, this.artworksById, currentDate());
		const artworks = [...items.map((item) => item.artwork), ...timeArtworks(times)];
		const shown = [...artworks, ...quizArtworks(items)];
		const glossary = this.#data().glossary;
		const drawn = drawnTerms(glossary, this.definitions ? (this.definitionCount ?? 0) : 0);
		const [, found, defined] = await Promise.all([
			this.#resolveInto(shown.filter((artwork) => artwork.pendingImage)),
			loadReviewDetails(artworks.map((artwork) => artwork.id)),
			loadTermDefinitions(drawn.map((term) => term.id))
		]);
		if (found.error) return found.error;
		this.details = found.details;
		if (free) this.freeRound += 1;
		this.#free = new FreeAnswers();
		this.session = new ReviewSession(
			withExtraSteps(
				items.map((item) => withItemImages(item, (artwork) => this.withImage(artwork))),
				[
					...definitionItems(withDefinitionsOf(drawn, defined.definitions), glossary),
					...times.map((step) => withTimeImages(step, (artwork) => this.withImage(artwork)))
				]
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
		const active = this.session;
		if (!active) return;
		await active.answer(choice);
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
