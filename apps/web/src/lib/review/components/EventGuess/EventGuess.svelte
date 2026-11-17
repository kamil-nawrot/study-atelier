<script lang="ts">
	import { untrack } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { Button, Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		askedYear,
		eraOfYear,
		eventBounds
	} from '#lib/review/event-questions/event-questions.ts';
	import { quizKey } from '#lib/review/keys/keys.ts';
	import type { EventItem } from '#lib/review/types/event-item.ts';
	import { sliderStart, yearOutcome, type Years } from '#lib/review/year-guess/year-guess.ts';
	import ReviewCard from '#lib/review/components/ReviewCard/ReviewCard.svelte';
	import YearAxis from '#lib/review/components/YearAxis/YearAxis.svelte';
	import YearSlider from '#lib/review/components/YearSlider/YearSlider.svelte';

	type Props = {
		item: EventItem;
		guessed?: number;
		today?: Date;
		onguess: (year: number) => void;
		onnext: () => void;
	};

	let { item, guessed, today = new Date(), onguess, onnext }: Props = $props();

	const wide = new MediaQuery('min-width: 768px');

	let heading = $state<HTMLElement>();
	let nextButton = $state<HTMLElement>();

	let asked = $derived(askedYear(item));
	let years = $derived<Years>([asked, asked]);
	let bounds = $derived(eventBounds(asked, today));
	let value = $state(untrack(() => sliderStart(bounds)));
	let answered = $derived(guessed !== undefined);
	let outcome = $derived(guessed === undefined ? undefined : yearOutcome(guessed, years, bounds));
	let yearText = $derived(m.atelier.year(asked, false));
	let eraName = $derived(m.review.year.eras[eraOfYear(asked)]);

	$effect(() => {
		void item.event.id;
		if (answered) nextButton?.querySelector('button')?.focus();
		else heading?.focus();
	});

	function check(): void {
		if (!answered) onguess(value);
	}

	function keydown(event: KeyboardEvent): void {
		quizKey(event, { answered, saving: false, options: 0, onanswer: () => {}, onnext });
	}
</script>

<svelte:window onkeydown={keydown} />

{#snippet stage()}
	<div class="event">
		<p class="name">{item.event.name}</p>
		{#if answered && item.event.description}
			<p class="description">{item.event.description}</p>
		{/if}
	</div>
{/snippet}

{#snippet guess()}
	{#if guessed !== undefined}
		<YearAxis {bounds} guess={guessed} {years} yearsText={yearText} />
	{:else}
		<YearSlider {bounds} label={m.review.event.slider} oncheck={check} bind:value />
	{/if}
{/snippet}

{#snippet actions()}
	{#if !wide.current}
		{@render guess()}
	{/if}
	<div bind:this={nextButton}>
		{#if answered}
			<Button aria-keyshortcuts="Enter" fullWidth onclick={onnext} variant="primary">
				{m.review.quiz.next}
				<Icon icon={ArrowRight} size="sm" />
			</Button>
		{:else}
			<Button aria-keyshortcuts="Enter" fullWidth onclick={check} variant="primary">
				{m.review.year.check}
			</Button>
		{/if}
	</div>
{/snippet}

<ReviewCard {actions} alt="" compact labelledby="quiz-heading" {stage}>
	{#snippet body()}
		<div class="intro" class:answered>
			<p class="overline">{m.review.event.tag}</p>
			<h1 bind:this={heading} id="quiz-heading" tabindex="-1">
				{m.review.event.questions[item.kind]}
			</h1>
			<p class="lead">{m.review.event.hint(eraName, m.atelier.eraSpan(bounds[0], bounds[1]))}</p>
		</div>
		{#if wide.current}
			{@render guess()}
		{/if}
		<div class="feedback" role="status">
			{#if outcome && guessed !== undefined}
				<p class="verdict">
					{m.review.year.results[outcome.rating]}
					{m.review.event.made[item.kind](yearText)}
				</p>
				<p>
					{outcome.direction === 'inside'
						? m.review.year.inside(m.atelier.year(guessed, false), false)
						: m.review.year.miss(
								m.atelier.year(guessed, false),
								outcome.miss,
								outcome.direction === 'late'
							)}
				</p>
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

	.event {
		display: grid;
		gap: var(--spacing-4);
		max-width: 40rem;
		padding: var(--spacing-6);
		background: var(--color-surface);
		color: var(--color-fg);
	}

	.name {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-xl);
		font-style: italic;
		line-height: var(--line-height-xl);
	}

	.description {
		color: var(--color-fg-muted);
	}

	@media (min-width: 768px) {
		.event {
			padding: var(--spacing-8);
		}

		.name {
			font-size: var(--font-size-2xl);
			line-height: var(--line-height-2xl);
		}
	}

	@media (max-width: 767.98px) {
		.intro.answered {
			display: none;
		}
	}
</style>
