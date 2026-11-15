<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { Button, Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { quizKey } from '#lib/review/keys/keys.ts';
	import type { RelationItem } from '#lib/review/types/relation-item.ts';
	import type { ReviewDetails } from '#lib/review/types/review-details.ts';
	import QuizOptions from '#lib/review/components/QuizOptions/QuizOptions.svelte';
	import ReviewCard from '#lib/review/components/ReviewCard/ReviewCard.svelte';

	type Props = {
		item: RelationItem;
		details?: ReviewDetails;
		chosen?: number;
		onanswer: (choice: number) => void;
		onnext: () => void;
	};

	let { item, details, chosen, onanswer, onnext }: Props = $props();

	let heading = $state<HTMLElement>();
	let nextButton = $state<HTMLElement>();

	let quiz = $derived(item.quiz);
	let answered = $derived(chosen !== undefined);
	let correct = $derived(chosen === quiz.answer);

	$effect(() => {
		void item.key;
		if (answered) nextButton?.querySelector('button')?.focus();
		else heading?.focus();
	});

	function keydown(event: KeyboardEvent): void {
		quizKey(event, { answered, saving: false, options: quiz.options.length, onanswer, onnext });
	}
</script>

<svelte:window onkeydown={keydown} />

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
	answersLast
	artwork={item.artwork}
	compact
	credit={details?.credit}
	image={item.artwork.image}
	labelledby="quiz-heading"
>
	{#snippet body()}
		<div class="intro">
			<p class="overline">{m.review.quiz.relationTag}</p>
			<h1 bind:this={heading} id="quiz-heading" tabindex="-1">
				{m.review.quiz.relationQuestions[item.question]}
			</h1>
			<p class="lead">
				{item.author
					? m.review.quiz.relationAuthor(item.author)
					: m.review.quiz.relationArtwork(item.artwork.title)}
			</p>
		</div>
		<div class="answers">
			<QuizOptions {chosen} {onanswer} {quiz} saving={false} />
		</div>
		<div class="feedback" role="status">
			{#if answered}
				<p class="verdict">
					{correct ? m.review.quiz.right : m.review.quiz.wrong}
					{quiz.options[quiz.answer].label}.
				</p>
				{#if !correct}
					<p class="caption">{m.review.quiz.relationRetry}</p>
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
</style>
