<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { Button, Icon, maskedSegments } from '@study-atelier/ui';
	import { noteTermsOf } from '#lib/glossary/note-terms/note-terms.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { quizKey } from '#lib/review/keys/keys.ts';
	import type { DefinitionItem } from '#lib/review/types/definition-item.ts';
	import QuizOptions from '#lib/review/components/QuizOptions/QuizOptions.svelte';
	import ReviewCard from '#lib/review/components/ReviewCard/ReviewCard.svelte';

	type Props = {
		item: DefinitionItem;
		chosen?: number;
		onanswer: (choice: number) => void;
		onnext: () => void;
	};

	let { item, chosen, onanswer, onnext }: Props = $props();

	let heading = $state<HTMLElement>();
	let nextButton = $state<HTMLElement>();

	let quiz = $derived(item.quiz);
	let answered = $derived(chosen !== undefined);
	let correct = $derived(chosen === quiz.answer);
	let segments = $derived(maskedSegments(item.term.definition, noteTermsOf([item.term])[0]));

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

{#snippet definition()}
	<blockquote class="definition">
		{#each segments as segment, index (index)}
			{#if !segment.masked}
				{segment.text}
			{:else if answered}
				<mark class="term">{segment.text}</mark>
			{:else}
				<span class="gap" aria-label={m.review.quiz.maskedTerm} role="img"></span>
			{/if}
		{/each}
	</blockquote>
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

<ReviewCard actions={next} alt="" compact labelledby="quiz-heading" stage={definition}>
	{#snippet body()}
		<div class="intro">
			<p class="caption">{m.review.quiz.definitionTag}</p>
			<h1 bind:this={heading} id="quiz-heading" tabindex="-1">
				{m.review.quiz.definitionQuestion}
			</h1>
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

	.definition {
		max-width: 40rem;
		color: var(--color-stage-fg);
		font-size: var(--font-size-md);
		line-height: var(--line-height-md);
		white-space: pre-line;
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
