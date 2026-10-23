<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import { onMount, untrack } from 'svelte';
	import { Alert, Button, Dialog, Icon, Tag } from '@study-atelier/ui';
	import { invalidate } from '$app/navigation';
	import { resolveImages } from '#lib/collection/artworks.ts';
	import AtelierLayout from '#lib/collection/components/AtelierLayout.svelte';
	import type { WallArtwork } from '#lib/collection/types.ts';
	import { m } from '#lib/i18n/index.ts';
	import Flashcard from '#lib/review/components/Flashcard.svelte';
	import Quiz from '#lib/review/components/Quiz.svelte';
	import ReviewStart from '#lib/review/components/ReviewStart.svelte';
	import ReviewSummary from '#lib/review/components/ReviewSummary.svelte';
	import {
		atelierKnowledge,
		formatWhen,
		freeScopeOptions,
		nextWaiting,
		type ReviewScope,
		sameScope,
		scopeArtworks,
		scopeOptions,
		type ScopeChoice,
		type SummaryGroup,
		summaryGroups,
		troubles,
		waitingTomorrow
	} from '#lib/review/overview.ts';
	import { offeredForms, quizzesPossible } from '#lib/review/forms.ts';
	import { missingArtworks, sessionCounts, startOfDay } from '#lib/review/queue.ts';
	import { QUIZ_TILE_SIZES, quizArtworks, sessionItems } from '#lib/review/quiz.ts';
	import {
		loadReviewDetails,
		loadSession,
		REVIEW_COUNTS_DEPENDENCY,
		withPinPreviews
	} from '#lib/review/review-data.ts';
	import { ReviewSession } from '#lib/review/review-session.svelte.ts';
	import type {
		ReviewCard,
		ReviewDetails,
		ReviewForm,
		ReviewItem,
		ReviewRating
	} from '#lib/review/types.ts';
	import type { PageProps } from './$types';

	type Summary = {
		count: number;
		minutes: number;
		tomorrow: number;
		groups: SummaryGroup[];
		free: boolean;
	};

	const PRELOAD_AHEAD = 2;
	const ALL_SCOPE: ReviewScope = { kind: 'all' };

	let { data }: PageProps = $props();

	onMount(() => {
		void refreshMenuCount();
	});

	async function refreshMenuCount(): Promise<void> {
		const fresh = data.waiting;
		if (data.reviewWaiting === undefined || fresh === undefined) return;
		if ((await data.reviewWaiting) !== fresh) void invalidate(REVIEW_COUNTS_DEPENDENCY);
	}

	let scope = $state<ReviewScope>(ALL_SCOPE);
	let form = $state<ReviewForm>(untrack(() => data.preferences.reviewForm));
	const forms = $derived(
		offeredForms(quizzesPossible(data.preferences.reviewQuizKinds, data.artworks, data.termPins))
	);
	const activeForm = $derived(forms.includes(form) ? form : 'mixed');
	let freeRound = $state(0);
	let cards = $state.raw(untrack(() => data.cards));
	let newToday = $state(untrack(() => data.newToday));
	let now = $state(new Date());
	let phase = $state<'start' | 'session' | 'summary'>('start');
	let session = $state<ReviewSession>();
	let summary = $state<Summary>();
	let starting = $state(false);
	let startError = $state<string>();
	let stopOpen = $state(false);
	let stopAfterSave = false;
	let resolved = $state.raw(new Map<string, WallArtwork>());
	let details = $state.raw(new Map<string, ReviewDetails>());
	let outcomes = $state<Record<ReviewRating, ReviewCard>>();

	const limits = $derived({
		sessionSize: data.preferences.reviewSessionSize,
		newPerDay: data.preferences.reviewNewPerDay
	});
	const allCounts = $derived(
		sessionCounts({
			artworks: scopeArtworks(data.artworks, ALL_SCOPE),
			cards,
			now,
			newToday,
			...limits
		})
	);
	const freeScopes = $derived(freeScopeOptions(data.artworks, cards));
	const freeOpen = $derived(
		data.preferences.reviewFree &&
			allCounts.known + allCounts.fresh === 0 &&
			missingArtworks(scopeArtworks(data.artworks, ALL_SCOPE)) === 0 &&
			freeScopes.length > 0
	);
	const scopes = $derived<ScopeChoice[]>(
		freeOpen
			? freeScopes
			: scopeOptions(data.artworks, cards, now).map((option) => {
					const planned = sessionCounts({
						artworks: scopeArtworks(data.artworks, option),
						cards,
						now,
						newToday,
						...limits
					});
					return { scope: option, count: planned.known + planned.fresh };
				})
	);
	const activeScope = $derived(
		scopes.find((option) => sameScope(option.scope, scope))?.scope ?? ALL_SCOPE
	);
	const scoped = $derived(scopeArtworks(data.artworks, activeScope));
	const counts = $derived(sessionCounts({ artworks: scoped, cards, now, newToday, ...limits }));
	const waiting = $derived(counts.known + counts.fresh);
	const missing = $derived(missingArtworks(scoped));
	const nextDate = $derived(
		waiting === 0 && missing === 0 ? nextWaiting(scoped, cards, now) : null
	);
	const artworksById = $derived(new Map(data.artworks.map((artwork) => [artwork.id, artwork])));
	const knowledge = $derived(atelierKnowledge(data.artworks, cards));
	const hard = $derived(troubles(data.artworks, cards).map(withImage));
	const current = $derived(session?.current);

	$effect(() => {
		const pending = troubles(data.artworks, cards).filter(
			(artwork) => artwork.pendingImage && !untrack(() => resolved.has(artwork.id))
		);
		if (pending.length > 0) void resolveInto(pending);
	});

	$effect(() => {
		if (!session) return;
		const ahead = session.queue.slice(session.position + 1, session.position + 1 + PRELOAD_AHEAD);
		for (const item of ahead) {
			preload(item.artwork);
			for (const option of item.quiz?.options ?? []) {
				if (option.artwork) preload(option.artwork, QUIZ_TILE_SIZES);
			}
		}
	});

	$effect(() => {
		void session?.position;
		window.scrollTo(0, 0);
	});

	function withImage(artwork: WallArtwork): WallArtwork {
		return resolved.get(artwork.id) ?? artwork;
	}

	function withImages(item: ReviewItem): ReviewItem {
		return {
			...item,
			artwork: withImage(item.artwork),
			...(item.quiz
				? {
						quiz: {
							...item.quiz,
							options: item.quiz.options.map((option) =>
								option.artwork ? { ...option, artwork: withImage(option.artwork) } : option
							)
						}
					}
				: {})
		};
	}

	async function resolveInto(artworks: WallArtwork[]): Promise<void> {
		const found = await resolveImages(artworks);
		if (found.length === 0) return;
		resolved = new Map([...resolved, ...found.map((artwork) => [artwork.id, artwork] as const)]);
	}

	function preload(artwork: WallArtwork, sizes = '(min-width: 768px) 60vw, 100vw'): void {
		const image = artwork.image;
		if (!image?.src) return;
		const loader = new Image();
		if (image.srcset) {
			loader.sizes = sizes;
			loader.srcset = image.srcset;
		}
		loader.src = image.src;
		void loader.decode().catch(() => undefined);
	}

	async function start(): Promise<void> {
		if (starting) return;
		starting = true;
		startError = undefined;
		try {
			startError = await prepareSession();
		} catch {
			startError = m.common.unexpectedError;
		}
		if (startError || !session) {
			now = new Date();
			phase = 'start';
		}
		starting = false;
	}

	async function prepareSession(): Promise<string | undefined> {
		const free = freeOpen;
		const dayStart = startOfDay(new Date());
		const loaded = free
			? await loadSession(dayStart, activeForm, activeScope, freeRound)
			: await loadSession(dayStart, activeForm, activeScope);
		const items = await withPinPreviews(sessionItems(loaded.rows, artworksById, cards));
		if (loaded.error || items.length === 0) return loaded.error;
		const artworks = items.map((item) => item.artwork);
		const shown = [...artworks, ...quizArtworks(items)];
		const [, found] = await Promise.all([
			resolveInto(shown.filter((artwork) => artwork.pendingImage)),
			loadReviewDetails(artworks.map((artwork) => artwork.id))
		]);
		if (found.error) return found.error;
		details = found.details;
		if (free) freeRound += 1;
		session = new ReviewSession(items.map(withImages), cards, undefined, undefined, free);
		summary = undefined;
		phase = 'session';
		return undefined;
	}

	function reveal(): void {
		if (!session) return;
		outcomes = session.next();
		session.reveal();
	}

	async function rate(rating: ReviewRating): Promise<void> {
		const active = session;
		if (!active) return;
		await active.rate(rating, outcomes?.[rating]);
		if (active === session && (active.finished || stopAfterSave)) finish();
	}

	async function answer(choice: number): Promise<void> {
		const active = session;
		if (!active) return;
		await active.answer(choice);
		if (active === session && stopAfterSave) finish();
	}

	function proceed(): void {
		if (!session) return;
		session.proceed();
		if (session.finished) finish();
	}

	function finish(): void {
		stopAfterSave = false;
		if (!session) return;
		if (!session.free) {
			cards = new Map(session.cards);
			newToday += session.started;
		}
		now = new Date();
		const answered = new Set(session.answers.map((answer) => answer.item.artwork.id));
		summary = {
			count: answered.size,
			minutes: session.minutes,
			tomorrow: session.free ? 0 : waitingTomorrow(scoped, cards, now, limits),
			groups: summaryGroups(session.answers),
			free: session.free
		};
		if (!session.free) void invalidate(REVIEW_COUNTS_DEPENDENCY);
		session = undefined;
		phase = answered.size > 0 ? 'summary' : 'start';
	}

	function askToStop(): void {
		if (session && session.answers.length > 0) stopOpen = true;
		else finish();
	}

	function stop(): void {
		stopOpen = false;
		if (session?.saving) stopAfterSave = true;
		else finish();
	}
</script>

<AtelierLayout
	email={data.session.user.email ?? ''}
	fill={phase === 'session'}
	title={m.review.title}
>
	{#snippet bar()}
		{#if phase === 'session' && session}
			<div class="session-bar">
				<button class="stop" onclick={askToStop} type="button">
					<Icon icon={X} />
					{m.review.stop}
				</button>
				{#if session.free}
					<Tag>{m.review.freeTag}</Tag>
				{/if}
				<div
					class="progress"
					aria-label={m.review.progressLabel}
					aria-valuemax={session.queue.length}
					aria-valuemin={0}
					aria-valuenow={session.position}
					role="progressbar"
				>
					<span class="caption">
						{m.review.progress(
							Math.min(session.position + 1, session.queue.length),
							session.queue.length
						)}
					</span>
					<span class="track" aria-hidden="true">
						<span
							style:width="{(session.position / Math.max(1, session.queue.length)) * 100}%"
							class="fill"
						></span>
					</span>
				</div>
			</div>
		{/if}
	{/snippet}

	{#if data.error}
		<Alert title={m.review.loadErrorTitle} tone="danger">{data.error}</Alert>
	{:else if phase === 'session' && session && current}
		{#key `${session.position}:${current.artwork.id}`}
			{#if current.quiz}
				<Quiz
					chosen={session.chosen}
					details={details.get(current.artwork.id)}
					error={session.error}
					item={{ ...current, quiz: current.quiz }}
					onanswer={answer}
					onnext={proceed}
					saving={session.saving}
				/>
			{:else}
				<Flashcard
					details={details.get(current.artwork.id)}
					error={session.error}
					glossary={data.glossary}
					item={current}
					onrate={rate}
					onreveal={reveal}
					revealed={session.revealed}
					saving={session.saving}
				/>
			{/if}
		{/key}
	{:else if phase === 'summary' && summary}
		<ReviewSummary
			count={summary.count}
			free={summary.free}
			{freeOpen}
			groups={summary.groups.map((group) => ({
				...group,
				artworks: group.artworks.map(withImage)
			}))}
			minutes={summary.minutes}
			nextRound={waiting}
			onfree={start}
			onnext={start}
			tomorrow={summary.tomorrow}
		/>
	{:else}
		<ReviewStart
			error={startError}
			form={activeForm}
			{forms}
			free={freeOpen}
			fresh={counts.fresh}
			{knowledge}
			known={counts.known}
			{missing}
			nextWhen={nextDate ? formatWhen(nextDate, now) : undefined}
			onform={(chosen) => (form = chosen)}
			onscope={(chosen) => {
				scope = chosen;
				freeRound = 0;
			}}
			onstart={start}
			scope={activeScope}
			{scopes}
			{starting}
			streak={data.streak}
			troubles={hard}
		/>
	{/if}
</AtelierLayout>

<Dialog
	description={session?.free ? m.review.freeStopDescription : m.review.stopDescription}
	onclose={() => (stopOpen = false)}
	size="small"
	title={m.review.stopTitle}
	bind:open={stopOpen}
>
	{#snippet footer()}
		<Button onclick={() => (stopOpen = false)}>{m.review.keepGoing}</Button>
		<Button onclick={stop} variant="primary">{m.review.stop}</Button>
	{/snippet}
</Dialog>

<style>
	.stop {
		display: flex;
		align-self: stretch;
		align-items: center;
		gap: var(--spacing-2);
		padding: 0 var(--spacing-2);
		border: none;
		background: transparent;
		color: var(--color-fg);
		font-family: inherit;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
		cursor: pointer;
	}

	.session-bar {
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-3);
		min-width: 0;
	}

	.progress {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
	}

	.progress .caption {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.track {
		display: none;
		width: 160px;
		height: var(--border-width-button);
		background: var(--color-tag);
	}

	.fill {
		display: block;
		height: 100%;
		background: var(--color-fg);
	}

	@media (min-width: 768px) {
		.track {
			display: block;
		}
	}

	@media (prefers-reduced-motion: no-preference) {
		.fill {
			transition: width var(--duration-short) ease-out;
		}
	}
</style>
