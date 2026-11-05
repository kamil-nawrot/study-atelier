<script lang="ts">
	import { untrack } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { Alert, Button, Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { quizKey } from '#lib/review/keys/keys.ts';
	import { authorsOf, describeArtwork } from '#lib/review/overview/overview.ts';
	import type { ReviewDetails } from '#lib/review/types/review-details.ts';
	import type { YearItem } from '#lib/review/types/year-item.ts';
	import {
		boundsOf,
		sliderStart,
		yearOutcome,
		yearsOf,
		type Years
	} from '#lib/review/year-guess/year-guess.ts';
	import ReviewCard from '#lib/review/components/ReviewCard/ReviewCard.svelte';
	import YearAxis from '#lib/review/components/YearAxis/YearAxis.svelte';
	import YearSlider from '#lib/review/components/YearSlider/YearSlider.svelte';

	type Props = {
		item: YearItem;
		details?: ReviewDetails;
		guessed?: number;
		saving: boolean;
		error?: string;
		today?: Date;
		onguess: (year: number) => void;
		onnext: () => void;
	};

	let {
		item,
		details,
		guessed,
		saving,
		error,
		today = new Date(),
		onguess,
		onnext
	}: Props = $props();

	const wide = new MediaQuery('min-width: 768px');

	let heading = $state<HTMLElement>();
	let nextButton = $state<HTMLElement>();

	let artwork = $derived(item.artwork);
	let years = $derived<Years>(yearsOf(artwork) ?? [0, 0]);
	let bounds = $derived<Years>(boundsOf(artwork, today) ?? years);
	let value = $state(untrack(() => sliderStart(bounds)));
	let answered = $derived(guessed !== undefined);
	let outcome = $derived(guessed === undefined ? undefined : yearOutcome(guessed, years, bounds));
	let span = $derived(years[0] !== years[1]);
	let yearsText = $derived(
		span ? m.atelier.span(years[0], years[1], false) : m.atelier.year(years[0], false)
	);
	let eraName = $derived(artwork.eraCode ? m.review.year.eras[artwork.eraCode] : '');
	let authors = $derived(authorsOf(artwork));

	$effect(() => {
		void artwork.id;
		if (answered) nextButton?.querySelector('button')?.focus();
		else heading?.focus();
	});

	function check(): void {
		if (!answered && !saving) onguess(value);
	}

	function keydown(event: KeyboardEvent): void {
		quizKey(event, { answered, saving, options: 0, onanswer: () => {}, onnext });
	}
</script>

<svelte:window onkeydown={keydown} />

{#snippet guess()}
	{#if guessed !== undefined}
		<YearAxis {bounds} guess={guessed} {years} {yearsText} />
	{:else}
		<YearSlider {bounds} disabled={saving} oncheck={check} bind:value />
	{/if}
{/snippet}

{#snippet actions()}
	{#if !wide.current}
		{@render guess()}
	{/if}
	{#if error}
		<Alert title={m.review.saveErrorTitle} tone="danger">{error}</Alert>
	{/if}
	<div bind:this={nextButton}>
		{#if answered}
			<Button aria-keyshortcuts="Enter" fullWidth onclick={onnext} variant="primary">
				{m.review.quiz.next}
				<Icon icon={ArrowRight} size="sm" />
			</Button>
		{:else}
			<Button
				aria-keyshortcuts="Enter"
				disabled={saving}
				fullWidth
				onclick={check}
				variant="primary"
			>
				{m.review.year.check}
			</Button>
		{/if}
	</div>
{/snippet}

<ReviewCard
	{actions}
	alt={answered ? describeArtwork(artwork) : m.review.flashcard.imageAlt}
	{artwork}
	compact
	credit={answered ? details?.credit : undefined}
	labelledby="quiz-heading"
>
	{#snippet body()}
		<div class="intro" class:answered>
			<p class="caption">{m.review.year.tag}</p>
			<h1 bind:this={heading} id="quiz-heading" tabindex="-1">{m.review.year.question}</h1>
			<p class="lead">{m.review.year.hint(eraName, m.atelier.eraSpan(bounds[0], bounds[1]))}</p>
		</div>
		{#if wide.current}
			{@render guess()}
		{/if}
		<div class="feedback" role="status">
			{#if outcome && guessed !== undefined}
				<p class="verdict">
					{m.review.year.results[outcome.rating]}
					<span class="visually-hidden"
						>{m.review.year.made(m.review.year.when(yearsText, span))}</span
					>
				</p>
				<p>
					{outcome.direction === 'inside'
						? m.review.year.inside(m.atelier.year(guessed, false), span)
						: m.review.year.miss(
								m.atelier.year(guessed, false),
								outcome.miss,
								outcome.direction === 'late'
							)}
				</p>
				<p><cite class="artwork-title">{artwork.title}</cite>{authors ? `, ${authors}` : ''}.</p>
			{/if}
		</div>
	{/snippet}
</ReviewCard>

<style>
	h1:focus {
		outline: none;
	}

	.intro,
	.feedback {
		display: grid;
		gap: var(--spacing-2);
	}

	.feedback:empty {
		display: none;
	}

	.verdict {
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
	}

	@media (max-width: 767.98px) {
		.intro.answered {
			display: none;
		}
	}
</style>
