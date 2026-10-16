<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import { untrack } from 'svelte';
	import { Alert, Button, Dialog, Icon } from '@study-atelier/ui';
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
		estimateMinutes,
		formatWhen,
		memoryByEra,
		nextWaiting,
		type ReviewScope,
		scopeArtworks,
		scopeOptions,
		type SummaryGroup,
		summaryGroups,
		troubles,
		waitingTomorrow
	} from '#lib/review/overview.ts';
	import { buildSession, missingArtworks } from '#lib/review/queue.ts';
	import { canAsk, quizArtworks, withQuizzes } from '#lib/review/quiz.ts';
	import { loadReviewDetails, REVIEW_COUNTS_DEPENDENCY } from '#lib/review/review-data.ts';
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
	};

	const PRELOAD_AHEAD = 2;

	let { data }: PageProps = $props();

	let scope = $state<ReviewScope>({ kind: 'all' });
	let form = $state<ReviewForm>('mixed');
	let cards = $state.raw(untrack(() => data.cards));
	let newToday = $state(untrack(() => data.newToday));
	let now = $state(new Date());
	let phase = $state<'start' | 'session' | 'summary'>('start');
	let session = $state<ReviewSession>();
	let summary = $state<Summary>();
	let starting = $state(false);
	let stopOpen = $state(false);
	let stopAfterSave = false;
	let resolved = $state.raw(new Map<string, WallArtwork>());
	let details = $state.raw(new Map<string, ReviewDetails>());
	let revealedAt = $state(new Date());
	let outcomes = $state<Record<ReviewRating, ReviewCard>>();

	const scoped = $derived(scopeArtworks(data.artworks, scope));
	const entries = $derived(
		buildSession({ artworks: scoped, cards, now, newToday, form: 'flashcards' })
	);
	const known = $derived(entries.filter((entry) => entry.card !== null).length);
	const missing = $derived(missingArtworks(scoped));
	const nextDate = $derived(
		entries.length === 0 && missing === 0 ? nextWaiting(scoped, cards, now) : null
	);
	const scopes = $derived(scopeOptions(data.artworks));
	const memory = $derived(memoryByEra(data.artworks, cards));
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
				if (option.artwork) preload(option.artwork, '(min-width: 768px) 280px, 45vw');
			}
		}
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
		const pool = scoped;
		const items = withQuizzes(
			buildSession({
				artworks: pool,
				cards,
				now: new Date(),
				newToday,
				form,
				canAsk: (artwork, mode) => canAsk(artwork, mode, pool)
			}),
			pool
		);
		const artworks = items.map((item) => item.artwork);
		const shown = [...artworks, ...quizArtworks(items)];
		const [, found] = await Promise.all([
			resolveInto(shown.filter((artwork) => artwork.pendingImage)),
			loadReviewDetails(artworks.map((artwork) => artwork.id))
		]);
		details = found;
		session = new ReviewSession(items.map(withImages), cards);
		summary = undefined;
		phase = 'session';
		starting = false;
	}

	function reveal(): void {
		if (!session) return;
		revealedAt = new Date();
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
		cards = new Map(session.cards);
		newToday += session.started;
		now = new Date();
		const answered = new Set(session.answers.map((answer) => answer.item.artwork.id));
		summary = {
			count: answered.size,
			minutes: session.minutes,
			tomorrow: waitingTomorrow(scoped, cards, now),
			groups: summaryGroups(session.answers)
		};
		session = undefined;
		phase = answered.size > 0 ? 'summary' : 'start';
		void invalidate(REVIEW_COUNTS_DEPENDENCY);
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
	fill={phase === 'session' && current?.mode !== 'quiz_image'}
	title={m.review.title}
>
	{#snippet bar()}
		{#if phase === 'session' && session}
			<div class="session-bar">
				<button class="stop" onclick={askToStop} type="button">
					<Icon icon={X} />
					{m.review.stop}
				</button>
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
		{:else}
			<span class="title">{m.review.title}</span>
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
					item={current}
					now={revealedAt}
					onrate={rate}
					onreveal={reveal}
					{outcomes}
					revealed={session.revealed}
					saving={session.saving}
				/>
			{/if}
		{/key}
	{:else if phase === 'summary' && summary}
		<ReviewSummary
			count={summary.count}
			groups={summary.groups.map((group) => ({
				...group,
				artworks: group.artworks.map(withImage)
			}))}
			minutes={summary.minutes}
			nextRound={entries.length}
			onnext={start}
			tomorrow={summary.tomorrow}
		/>
	{:else}
		<ReviewStart
			{form}
			fresh={entries.length - known}
			{known}
			{memory}
			minutes={estimateMinutes(entries.length)}
			{missing}
			nextWhen={nextDate ? formatWhen(nextDate, now) : undefined}
			onform={(chosen) => (form = chosen)}
			onscope={(chosen) => (scope = chosen)}
			onstart={start}
			{scope}
			{scopes}
			{starting}
			troubles={hard}
		/>
	{/if}
</AtelierLayout>

<Dialog
	description={m.review.stopDescription}
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
	.title,
	.stop {
		display: flex;
		align-items: center;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}

	.stop {
		align-self: stretch;
		gap: var(--spacing-2);
		padding: 0 var(--spacing-2);
		border: none;
		background: transparent;
		color: var(--color-fg);
		font-family: inherit;
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
