<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { MediaQuery } from 'svelte/reactivity';
	import { Button, Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { quizKey } from '#lib/review/keys/keys.ts';
	import type { NoteGapItem } from '#lib/review/types/note-gap-item.ts';
	import type { ReviewDetails } from '#lib/review/types/review-details.ts';
	import NoteGapCard from '#lib/review/components/NoteGapCard/NoteGapCard.svelte';
	import QuizOptions from '#lib/review/components/QuizOptions/QuizOptions.svelte';
	import ReviewCard from '#lib/review/components/ReviewCard/ReviewCard.svelte';

	type Props = {
		item: NoteGapItem;
		details?: ReviewDetails;
		chosen?: number;
		onanswer: (choice: number) => void;
		onnext: () => void;
	};

	let { item, details, chosen, onanswer, onnext }: Props = $props();

	const phone = new MediaQuery('max-width: 767.98px');

	let heading = $state<HTMLElement>();
	let nextButton = $state<HTMLElement>();

	let quiz = $derived(item.quiz);
	let answered = $derived(chosen !== undefined);
	let correct = $derived(chosen === quiz.answer);

	$effect(() => {
		void item.term.id;
		if (answered) nextButton?.querySelector('button')?.focus();
		else heading?.focus();
	});

	function keydown(event: KeyboardEvent): void {
		quizKey(event, { answered, saving: false, options: quiz.options.length, onanswer, onnext });
	}
</script>

<svelte:window onkeydown={keydown} />

{#snippet note()}
	<blockquote class="note">
		<p>
			{#each item.segments as segment, index (index)}
				{#if !segment.masked}
					{segment.text}
				{:else if answered}
					<mark class="term">{segment.text}</mark>
				{:else}
					<span class="gap" aria-label={m.review.quiz.maskedTerm} role="img"></span>
				{/if}
			{/each}
		</p>
		<p class="caption">
			{m.review.quiz.noteSource}
			<cite class="artwork-title">{item.artwork.title}</cite>
		</p>
	</blockquote>
{/snippet}

{#snippet card()}
	<NoteGapCard {answered} artwork={item.artwork} {note} />
{/snippet}

{#snippet next()}
	<div bind:this={nextButton}>
		<Button
			aria-keyshortcuts="Enter"
			disabled={!answered}
			fullWidth
			onclick={onnext}
			variant="primary"
		>
			{m.review.quiz.next}
			<Icon icon={ArrowRight} size="sm" />
		</Button>
	</div>
{/snippet}

<ReviewCard
	actions={next}
	alt={item.artwork.title}
	artwork={item.artwork}
	compact
	credit={details?.credit}
	image={item.artwork.image}
	labelledby="quiz-heading"
	stage={phone.current ? card : undefined}
>
	{#snippet body()}
		<div class="intro">
			<p class="overline">{m.review.quiz.noteTag}</p>
			<h1 bind:this={heading} id="quiz-heading" tabindex="-1">{m.review.quiz.noteQuestion}</h1>
			{#if !phone.current}
				{@render note()}
			{/if}
		</div>
		<QuizOptions {chosen} {onanswer} {quiz} saving={false} />
		<div class="feedback" role="status">
			{#if answered}
				<p class="verdict">
					{correct ? m.review.quiz.right : m.review.quiz.wrong}
					{quiz.options[quiz.answer].label}.
				</p>
				{#if !correct}
					<p class="caption">{m.review.quiz.definitionRetry}</p>
				{/if}
			{/if}
		</div>
	{/snippet}
</ReviewCard>

<style>
	h1:focus {
		outline: none;
	}

	.intro,
	.feedback,
	.note {
		display: grid;
		gap: var(--spacing-2);
	}

	.note {
		margin: 0;
		padding-left: var(--spacing-4);
		border-left: var(--border-width-button) solid var(--color-fg-muted);
	}

	.note .artwork-title {
		font-size: inherit;
		line-height: inherit;
	}

	.feedback:empty {
		display: none;
	}

	.verdict {
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
	}

	.gap,
	.term {
		padding: 0 var(--spacing-1);
		background: var(--color-tag);
		color: inherit;
	}

	.gap {
		display: inline-block;
		width: 4em;
		height: 1em;
		vertical-align: -0.1em;
	}
</style>
