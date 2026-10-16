<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import { Alert, ArtworkImage, Button, Icon } from '@study-atelier/ui';
	import type { WallArtwork } from '#lib/collection/types.ts';
	import { m } from '#lib/i18n/index.ts';
	import { onControl, sessionKey } from '../keys.ts';
	import { authorsOf } from '../overview.ts';
	import { QUIZ_TILE_SIZES } from '../quiz.ts';
	import type { Quiz, QuizOption, QuizReason, ReviewDetails, ReviewItem } from '../types.ts';
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

	const REASONS: readonly QuizReason[] = ['author', 'style', 'period'];

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

	function keydown(event: KeyboardEvent): void {
		if (!sessionKey(event)) return;
		if (event.key === 'Enter' && answered) {
			if (onControl(event)) return;
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

{#snippet mark(index: number)}
	{#if answered && index === quiz.answer}
		<Icon icon={Check} size="sm" />
	{:else if answered && index === chosen}
		<Icon icon={X} size="sm" />
	{:else}
		{index + 1}
	{/if}
{/snippet}

{#snippet tiles()}
	<ol class="tiles" aria-label={m.review.quiz.options}>
		{#each quiz.options as option, index (option.artwork?.id ?? option.label)}
			{@const image = option.artwork?.image}
			{@const imageAlt =
				answered && option.artwork ? describe(option.artwork) : m.review.quiz.imageAlt(index + 1)}
			<li
				style:--artwork-ratio={image ? image.width / image.height : undefined}
				class="tile"
				class:muted={answered && index !== quiz.answer && index !== chosen}
				class:right={answered && index === quiz.answer}
				class:wrong={answered && index === chosen && !correct}
			>
				<button
					class="pick"
					aria-keyshortcuts={String(index + 1)}
					disabled={answered || saving}
					onclick={() => onanswer(index)}
					type="button"
				>
					<span class="window">
						{#if image?.src}
							<ArtworkImage
								alt={imageAlt}
								height={image.height}
								loading="eager"
								sizes={QUIZ_TILE_SIZES}
								src={image.src}
								srcset={image.srcset}
								width={image.width}
							/>
						{:else}
							<ArtworkImage alt={imageAlt} unavailable />
						{/if}
						<span class="badge" aria-hidden="true">{@render mark(index)}</span>
					</span>
					{@render optionState(index)}
				</button>
				<p class="tile-caption">
					{#if answered}
						<cite class="artwork-title">{option.label}</cite>
						<span class="caption">{optionDetails(option)}</span>
					{/if}
				</p>
			</li>
		{/each}
	</ol>
{/snippet}

<ReviewCard
	actions={next}
	{alt}
	{artwork}
	compact
	credit={answered ? details?.credit : undefined}
	labelledby="quiz-heading"
	stage={item.mode === 'quiz_image' ? tiles : undefined}
>
	{#snippet body()}
		<div class="intro">
			<h1 bind:this={heading} id="quiz-heading" tabindex="-1">
				{#if item.mode === 'quiz_image'}
					{m.review.quiz.imageQuestion.start}
					<cite class="artwork-title">{artwork.title}</cite>{m.review.quiz.imageQuestion.end}
				{:else if item.mode === 'quiz_style'}
					{m.review.quiz.styleQuestion}
				{:else}
					{m.review.quiz.titleQuestion}
				{/if}
			</h1>
			{#if item.mode === 'quiz_image'}
				<p class="lead">
					<span class="pointer">{m.review.quiz.imageHint}</span>
					<span class="touch">{m.review.quiz.imageHintTouch}</span>
				</p>
			{:else if item.mode === 'quiz_style'}
				<p class="lead">{m.review.quiz.styleHint}</p>
			{/if}
		</div>
		{#if item.mode !== 'quiz_image'}
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
								<span class="caption reasons">
									{#each REASONS as reason (reason)}
										<span class:shown={answered && option.reason === reason}>
											{m.review.quiz.reasons[reason]}
										</span>
									{/each}
								</span>
							</span>
							{@render optionState(index)}
						</button>
					</li>
				{/each}
			</ol>
		{/if}
		{@render feedback()}
	{/snippet}
</ReviewCard>

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

	.touch {
		display: none;
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
		--tile-gap: var(--spacing-3);
		--tile-band: calc(
			var(--spacing-2) + var(--font-size-lg) * var(--line-height-lg) + var(--spacing-1) +
				var(--font-size-xs) * var(--line-height-xs) + var(--spacing-3)
		);
		--tile-max-width: calc(
			(100cqw - var(--tile-gap)) / 2 - 2 * var(--spacing-2) - 2 * var(--border-width-button)
		);
		--tile-max-height: 20dvh;

		container-type: inline-size;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		place-items: center;
		gap: var(--tile-gap);
		width: 100%;
	}

	.tile {
		position: relative;
		display: grid;
		padding: var(--spacing-2) var(--spacing-2) 0;
		border: var(--border-width-button) solid transparent;
		background: var(--color-mat-bg);
		color: var(--color-mat-fg);
	}

	.pick {
		display: block;
		padding: 0;
		border: none;
		background: transparent;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	.pick:enabled::after {
		content: '';
		position: absolute;
		inset: 0;
	}

	.pick:disabled,
	.option:disabled {
		cursor: default;
	}

	.window {
		position: relative;
		display: block;
	}

	.window :global(img) {
		display: block;
		width: min(var(--tile-max-width), calc(var(--tile-max-height) * var(--artwork-ratio, 0.8)));
		height: auto;
		background: var(--color-mat-window);
	}

	.badge {
		position: absolute;
		top: var(--spacing-2);
		left: var(--spacing-2);
		z-index: 1;
		display: grid;
		place-items: center;
		min-width: var(--spacing-6);
		height: var(--spacing-6);
		padding: 0 var(--spacing-1);
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
		align-content: start;
		gap: var(--spacing-1);
		width: 0;
		min-width: 100%;
		height: var(--tile-band);
		padding: var(--spacing-2) 0 var(--spacing-3);
	}

	.tile-caption > * {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tile-caption .caption {
		color: var(--color-mat-fg-muted);
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

	.label {
		display: grid;
		flex: 1;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: baseline;
		gap: var(--spacing-3);
	}

	.reasons {
		display: grid;
		justify-items: end;
		white-space: nowrap;
	}

	.reasons > span {
		grid-area: 1 / 1;
		visibility: hidden;
	}

	.reasons > .shown {
		visibility: visible;
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
		.tiles {
			--tile-gap: var(--spacing-4);
			--tile-max-height: calc(
				(100cqh - var(--tile-gap)) / 2 - var(--spacing-2) - var(--tile-band) - 2 *
					var(--border-width-button)
			);

			grid-template-columns: repeat(2, auto);
			justify-content: center;
			align-content: center;
		}
	}
</style>
