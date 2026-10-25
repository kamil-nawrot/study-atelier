<script lang="ts">
	import Hourglass from '@lucide/svelte/icons/hourglass';
	import SwatchBook from '@lucide/svelte/icons/swatch-book';
	import UserPen from '@lucide/svelte/icons/user-pen';
	import type { LucideIcon } from '@lucide/svelte';
	import { Icon, Tooltip } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import QuizChoiceState from '#lib/review/components/QuizChoiceState/QuizChoiceState.svelte';
	import QuizMark from '#lib/review/components/QuizMark/QuizMark.svelte';
	import type { Quiz } from '#lib/review/types/quiz.ts';
	import type { QuizReason } from '#lib/review/types/quiz-reason.ts';

	type Props = {
		quiz: Quiz;
		chosen?: number;
		saving: boolean;
		onanswer: (choice: number) => void;
	};

	let { quiz, chosen, saving, onanswer }: Props = $props();

	const REASON_ICONS: Record<QuizReason, LucideIcon> = {
		author: UserPen,
		style: SwatchBook,
		period: Hourglass
	};

	let answered = $derived(chosen !== undefined);
</script>

<ol class="options" aria-label={m.review.quiz.options}>
	{#each quiz.options as option, index (option.artwork?.id ?? option.label)}
		<li>
			<button
				class="option"
				class:muted={answered && index !== quiz.answer && index !== chosen}
				class:right={answered && index === quiz.answer}
				class:wrong={answered && index === chosen && chosen !== quiz.answer}
				aria-keyshortcuts={String(index + 1)}
				disabled={answered || saving}
				onclick={() => onanswer(index)}
				type="button"
			>
				<span class="key" aria-hidden="true">
					<QuizMark answer={quiz.answer} {chosen} {index} />
				</span>
				<span class="label">
					{#if option.artwork}
						<cite class="artwork-title">{option.label}</cite>
					{:else}
						{option.label}
					{/if}
				</span>
				<span class="reason">
					{#if answered && option.reason}
						{@const reason = option.reason}
						<Tooltip align="end" text={m.review.quiz.reasonLabels[reason]}>
							{#snippet children(id)}
								<span class="reason-icon" aria-describedby={id}>
									<Icon
										icon={REASON_ICONS[reason]}
										label={m.review.quiz.reasons[reason]}
										size="sm"
									/>
								</span>
							{/snippet}
						</Tooltip>
					{/if}
				</span>
				<QuizChoiceState answer={quiz.answer} {chosen} {index} />
			</button>
		</li>
	{/each}
</ol>

<style>
	.options {
		display: grid;
		gap: var(--spacing-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.option {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
		width: 100%;
		min-height: var(--size-control);
		padding: var(--spacing-2) var(--spacing-3);
		border: var(--border-width-button) solid var(--color-fg);
		background: transparent;
		color: var(--color-fg);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.option:disabled {
		cursor: default;
	}

	.option.muted {
		border-color: var(--color-tag);
		color: var(--color-fg-muted);
	}

	.option.right {
		border-color: var(--color-success);
	}

	.option.wrong {
		border-color: var(--color-danger);
	}

	.key {
		display: grid;
		flex: none;
		place-items: center;
		min-width: var(--spacing-6);
		height: var(--spacing-6);
		border: var(--border-width-hairline) solid currentcolor;
		font-size: var(--font-size-xs);
		font-variant-numeric: tabular-nums;
		line-height: var(--line-height-xs);
	}

	.right .key {
		border-color: var(--color-success);
		color: var(--color-success);
	}

	.wrong .key {
		border-color: var(--color-danger);
		color: var(--color-danger);
	}

	.reason-icon {
		display: flex;
	}

	.label {
		flex: 1;
		min-width: 0;
	}

	.reason {
		display: flex;
		flex: none;
		align-items: center;
		justify-content: center;
		width: var(--spacing-6);
		color: var(--color-fg-muted);
	}
</style>
