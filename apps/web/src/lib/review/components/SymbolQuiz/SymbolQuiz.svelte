<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { Button, Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import DetailLens from '#lib/pins/components/DetailLens/DetailLens.svelte';
	import { quizKey } from '#lib/review/keys/keys.ts';
	import type { SymbolItem } from '#lib/review/types/symbol-item.ts';
	import QuizOptions from '#lib/review/components/QuizOptions/QuizOptions.svelte';
	import ReviewCard from '#lib/review/components/ReviewCard/ReviewCard.svelte';

	type Props = {
		item: SymbolItem;
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

{#snippet detail()}
	<div class="detail">
		{#if item.lens}
			<DetailLens lens={item.lens} />
		{/if}
	</div>
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

<ReviewCard actions={next} alt="" compact labelledby="quiz-heading" stage={detail}>
	{#snippet body()}
		<div class="intro">
			<p class="overline">{m.review.quiz.symbolTag}</p>
			<h1 bind:this={heading} id="quiz-heading" tabindex="-1">
				{m.review.quiz.symbolQuestions[item.kind]}
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

	.detail {
		--detail-lens: min(70vw, 22rem);

		display: flex;
		justify-content: center;
		padding: var(--spacing-6);
	}
</style>
