<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import { Alert, Button, Icon } from '@study-atelier/ui';
	import type { WallArtwork } from '#lib/collection/types.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { Quiz, QuizOption, ReviewDetails, ReviewItem } from '../types.ts';
	import ReviewCard from './ReviewCard.svelte';

	type Props = {
		item: ReviewItem & { quiz: Quiz };
		details?: ReviewDetails;
		chosen?: number;
		saving: boolean;
		error?: string;
		onanswer: (choice: number) => void;
		onnext: () => void;
	};

	let { item, details, chosen, saving, error, onanswer, onnext }: Props = $props();

	let heading = $state<HTMLElement>();
	let nextButton = $state<HTMLElement>();

	let artwork = $derived(item.artwork);
	let quiz = $derived(item.quiz);
	let answered = $derived(chosen !== undefined);
	let correct = $derived(chosen === quiz.answer);
	let picked = $derived(chosen === undefined ? undefined : quiz.options[chosen]);
	let alt = $derived(answered ? describe(artwork) : m.review.flashcard.imageAlt);

	$effect(() => {
		void artwork.id;
		if (answered) nextButton?.querySelector('button')?.focus();
		else heading?.focus();
	});

	function authorsOf(work: WallArtwork): string {
		return work.authors.length > 0 ? work.authors.join(', ') : m.ui.unknownAuthor;
	}

	function byline(work: WallArtwork): string {
		return [authorsOf(work), work.date].filter(Boolean).join(', ');
	}

	function describe(work: WallArtwork): string {
		return `${work.title}, ${authorsOf(work)}`;
	}

	function optionDetails(option: QuizOption): string {
		if (!option.artwork) return '';
		return [
			authorsOf(option.artwork),
			option.artwork.date,
			option.reason ? m.review.quiz.reasons[option.reason] : undefined
		]
			.filter(Boolean)
			.join(' · ');
	}

	function typing(target: EventTarget | null): boolean {
		if (!(target instanceof HTMLElement)) return false;
		return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
	}

	function keydown(event: KeyboardEvent): void {
		if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
		if (typing(event.target) || document.querySelector('dialog[open]')) return;
		if (event.key === 'Enter' && answered) {
			if (event.target instanceof HTMLElement && event.target.closest('button, a')) return;
			event.preventDefault();
			onnext();
			return;
		}
		const choice = Number(event.key) - 1;
		if (
			!answered &&
			!saving &&
			Number.isInteger(choice) &&
			choice >= 0 &&
			choice < quiz.options.length
		) {
			event.preventDefault();
			onanswer(choice);
		}
	}
</script>

<svelte:window onkeydown={keydown} />

{#snippet optionState(index: number)}
	{#if answered && index === quiz.answer}
		<span class="hidden">, {m.review.quiz.rightOption}</span>
	{:else if index === chosen}
		<span class="hidden">, {m.review.quiz.chosenOption}</span>
	{/if}
{/snippet}

{#snippet feedback()}
	<div class="feedback" role="status">
		{#if answered && picked}
			{#if item.mode === 'quiz_style'}
				<p class="verdict">
					{correct ? m.review.quiz.right : m.review.quiz.wrong}
					{quiz.options[quiz.answer].label}.
				</p>
				<p><cite class="artwork-title">{artwork.title}</cite>, {byline(artwork)}.</p>
			{:else if item.mode === 'quiz_image' && !correct}
				<p class="verdict">
					{m.review.quiz.wrong} <cite class="artwork-title">{picked.label}</cite>.
				</p>
				<p>{m.review.quiz.marked}</p>
			{:else}
				<p class="verdict">
					{correct ? m.review.quiz.right : m.review.quiz.wrong}
					<cite class="artwork-title">{artwork.title}</cite>.
				</p>
				<p>{byline(artwork)}.</p>
			{/if}
			{#if !correct}
				<p class="caption">{m.review.quiz.retry}</p>
			{/if}
		{/if}
	</div>
{/snippet}

{#snippet next()}
	{#if error}
		<Alert title={m.review.saveErrorTitle} tone="danger">{error}</Alert>
	{/if}
	{#if answered}
		<div bind:this={nextButton}>
			<Button aria-keyshortcuts="Enter" fullWidth onclick={onnext} variant="primary">
				{m.review.quiz.next}
				<Icon icon={ArrowRight} size="sm" />
			</Button>
		</div>
	{/if}
{/snippet}

{#snippet mark(index: number)}
	{#if answered && index === quiz.answer}
		<Icon icon={Check} size="sm" />
	{:else if answered && index === chosen}
		<Icon icon={X} size="sm" />
	{:else}
		{index + 1}
	{/if}
{/snippet}

{#if item.mode === 'quiz_image'}
	<div class="images">
		<section class="question" aria-labelledby="quiz-heading">
			<h1 bind:this={heading} id="quiz-heading" tabindex="-1">
				{m.review.quiz.imageQuestion.start}
				<cite class="artwork-title">{artwork.title}</cite>{m.review.quiz.imageQuestion.end}
			</h1>
			{#if !answered}
				<p class="lead hint">
					<span class="pointer">{m.review.quiz.imageHint}</span>
					<span class="touch">{m.review.quiz.imageHintTouch}</span>
				</p>
			{/if}
			{@render feedback()}
		</section>
		<ol class="tiles" aria-label={m.review.quiz.options}>
			{#each quiz.options as option, index (option.artwork?.id ?? option.label)}
				<li>
					<button
						class="tile"
						class:muted={answered && index !== quiz.answer && index !== chosen}
						class:right={answered && index === quiz.answer}
						class:wrong={answered && index === chosen && !correct}
						aria-keyshortcuts={String(index + 1)}
						disabled={answered || saving}
						onclick={() => onanswer(index)}
						type="button"
					>
						<span class="badge" aria-hidden="true">{@render mark(index)}</span>
						{#if option.artwork?.image?.src}
							<img
								alt={answered && option.artwork
									? describe(option.artwork)
									: m.review.quiz.imageAlt(index + 1)}
								height={option.artwork.image.height}
								sizes="(min-width: 768px) 280px, 45vw"
								src={option.artwork.image.src}
								srcset={option.artwork.image.srcset}
								width={option.artwork.image.width}
							/>
						{:else}
							<span class="hidden">{m.review.quiz.imageAlt(index + 1)}</span>
						{/if}
						{@render optionState(index)}
					</button>
					{#if answered}
						<p class="tile-caption">
							<cite class="artwork-title">{option.label}</cite>
							<span class="caption">{optionDetails(option)}</span>
						</p>
					{/if}
				</li>
			{/each}
		</ol>
		{#if answered || error}
			<div class="actions">
				{@render next()}
			</div>
		{/if}
	</div>
{:else}
	<ReviewCard
		actions={answered || error ? next : undefined}
		{alt}
		{artwork}
		compact
		credit={answered ? details?.credit : undefined}
		labelledby="quiz-heading"
	>
		{#snippet body()}
			<div class="intro">
				<h1 bind:this={heading} id="quiz-heading" tabindex="-1">
					{item.mode === 'quiz_style' ? m.review.quiz.styleQuestion : m.review.quiz.titleQuestion}
				</h1>
				{#if item.mode === 'quiz_style' && !answered}
					<p class="lead">{m.review.quiz.styleHint}</p>
				{/if}
			</div>
			<ol class="options" aria-label={m.review.quiz.options}>
				{#each quiz.options as option, index (option.artwork?.id ?? option.label)}
					<li>
						<button
							class="option"
							class:muted={answered && index !== quiz.answer && index !== chosen}
							class:right={answered && index === quiz.answer}
							class:wrong={answered && index === chosen && !correct}
							aria-keyshortcuts={String(index + 1)}
							disabled={answered || saving}
							onclick={() => onanswer(index)}
							type="button"
						>
							<span class="key" aria-hidden="true">{@render mark(index)}</span>
							<span class="label">
								{#if option.artwork}
									<cite class="artwork-title">{option.label}</cite>
								{:else}
									{option.label}
								{/if}
								{#if answered && option.reason}
									<span class="caption">{m.review.quiz.reasons[option.reason]}</span>
								{/if}
							</span>
							{@render optionState(index)}
						</button>
					</li>
				{/each}
			</ol>
			{@render feedback()}
		{/snippet}
	</ReviewCard>
{/if}

<style>
	h1:focus {
		outline: none;
	}

	.hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
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

	.images {
		display: grid;
		align-content: start;
		gap: var(--spacing-6);
		width: 100%;
		max-width: var(--size-content-wide);
	}

	.question {
		display: grid;
		align-content: start;
		gap: var(--spacing-4);
	}

	.touch {
		display: none;
	}

	.actions {
		position: sticky;
		bottom: 0;
		z-index: 1;
		display: grid;
		gap: var(--spacing-3);
		padding: var(--spacing-4) 0;
		border-top: var(--border-width-hairline) solid var(--color-tag);
		background: var(--color-bg);
	}

	.tiles,
	.options {
		display: grid;
		gap: var(--spacing-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.tiles {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		align-items: start;
	}

	.tiles li {
		display: grid;
		gap: var(--spacing-2);
	}

	.tile {
		position: relative;
		display: block;
		width: 100%;
		aspect-ratio: 1;
		padding: 0;
		border: var(--border-width-button) solid transparent;
		background: var(--color-mat-bg);
		cursor: pointer;
	}

	.tile:disabled,
	.option:disabled {
		cursor: default;
	}

	.tile img {
		position: absolute;
		inset: var(--spacing-3);
		display: block;
		width: calc(100% - 2 * var(--spacing-3));
		height: calc(100% - 2 * var(--spacing-3));
		object-fit: contain;
	}

	.badge {
		position: absolute;
		top: 0;
		left: 0;
		display: grid;
		place-items: center;
		min-width: var(--spacing-6);
		height: var(--spacing-6);
		background: var(--color-mat-badge-bg);
		color: var(--color-mat-badge-fg);
		font-size: var(--font-size-xs);
		font-variant-numeric: tabular-nums;
		line-height: var(--line-height-xs);
	}

	.tile.right {
		border-color: var(--color-success);
	}

	.tile.wrong {
		border-color: var(--color-danger);
	}

	.tile.right .badge {
		background: var(--color-success);
		color: var(--color-bg);
	}

	.tile.wrong .badge {
		background: var(--color-danger);
		color: var(--color-bg);
	}

	.tile.muted {
		opacity: 0.6;
	}

	.tile-caption {
		display: grid;
		gap: var(--spacing-1);
	}

	.option {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
		width: 100%;
		min-height: var(--size-control);
		padding: var(--spacing-2) var(--spacing-4);
		border: var(--border-width-button) solid var(--color-fg);
		background: transparent;
		color: var(--color-fg);
		font: inherit;
		text-align: left;
		cursor: pointer;
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

	.label {
		display: grid;
		gap: var(--spacing-1);
	}

	@media (hover: none) {
		.pointer {
			display: none;
		}

		.touch {
			display: inline;
		}
	}

	@media (min-width: 768px) {
		.images {
			grid-template-areas:
				'question tiles'
				'actions tiles';
			grid-template-rows: auto 1fr;
			grid-template-columns: minmax(0, 360px) auto;
			justify-content: center;
			gap: var(--spacing-6) var(--spacing-12);
		}

		.question {
			grid-area: question;
		}

		.tiles {
			grid-area: tiles;
			grid-template-columns: repeat(2, min(30dvh, 280px));
			gap: var(--spacing-4);
		}

		.actions {
			position: static;
			grid-area: actions;
			align-self: start;
			justify-self: start;
			padding: 0;
			border-top: none;
		}
	}
</style>
