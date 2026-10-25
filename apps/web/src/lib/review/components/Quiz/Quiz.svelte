<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Check from '@lucide/svelte/icons/check';
	import Hourglass from '@lucide/svelte/icons/hourglass';
	import Maximize2 from '@lucide/svelte/icons/maximize-2';
	import SwatchBook from '@lucide/svelte/icons/swatch-book';
	import UserPen from '@lucide/svelte/icons/user-pen';
	import X from '@lucide/svelte/icons/x';
	import type { LucideIcon } from '@lucide/svelte';
	import { tick } from 'svelte';
	import { Alert, ArtworkImage, Button, Icon, Tooltip } from '@study-atelier/ui';
	import {
		artworkImageCredit,
		artworkImageSource
	} from '#lib/images/artwork-image/artwork-image.ts';
	import ImageViewer from '#lib/images/components/ImageViewer/ImageViewer.svelte';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import PinMark from '#lib/pins/components/PinMark/PinMark.svelte';
	import { onControl, sessionKey } from '#lib/review/keys/keys.ts';
	import { authorsOf } from '#lib/review/overview/overview.ts';
	import { QUIZ_TILE_SIZES } from '#lib/review/quiz/quiz.ts';
	import type { Quiz } from '#lib/review/types/quiz.ts';
	import type { QuizOption } from '#lib/review/types/quiz-option.ts';
	import type { QuizReason } from '#lib/review/types/quiz-reason.ts';
	import type { ReviewDetails } from '#lib/review/types/review-details.ts';
	import type { ReviewItem } from '#lib/review/types/review-item.ts';
	import ReviewCard from '#lib/review/components/ReviewCard/ReviewCard.svelte';

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

	const FALLBACK_RATIO = 0.8;
	const STAGE_WIDTH = 960;

	const REASON_ICONS: Record<QuizReason, LucideIcon> = {
		author: UserPen,
		style: SwatchBook,
		period: Hourglass
	};

	let heading = $state<HTMLElement>();
	let nextButton = $state<HTMLElement>();
	let viewer: ReturnType<typeof ImageViewer>;
	let viewed = $state<{ image: WallArtwork['image']; alt: string }>();

	let artwork = $derived(item.artwork);
	let quiz = $derived(item.quiz);
	let answered = $derived(chosen !== undefined);
	let correct = $derived(chosen === quiz.answer);
	let picked = $derived(chosen === undefined ? undefined : quiz.options[chosen]);
	let alt = $derived(answered ? describe(artwork) : m.review.flashcard.imageAlt);
	let pin = $derived(item.pin);
	let credit = $derived(pin ? artworkImageCredit(pin.image) : details?.credit);

	$effect(() => {
		void artwork.id;
		if (answered) nextButton?.querySelector('button')?.focus();
		else heading?.focus();
	});

	function byline(work: WallArtwork): string {
		return [authorsOf(work), work.date].filter(Boolean).join(', ');
	}

	function ratioOf(option: QuizOption): number {
		const image = option.artwork?.image;
		return image ? image.width / image.height : FALLBACK_RATIO;
	}

	async function enlarge(image: WallArtwork['image'], alt: string): Promise<void> {
		viewed = { image, alt };
		await tick();
		viewer.open();
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
		<span class="visually-hidden">, {m.review.quiz.rightOption}</span>
	{:else if index === chosen}
		<span class="visually-hidden">, {m.review.quiz.chosenOption}</span>
	{/if}
{/snippet}

{#snippet feedback()}
	<div class="feedback" role="status">
		{#if answered && picked}
			{#if item.mode === 'quiz_style' || item.mode === 'quiz_pin'}
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
	<div
		style:--r1={ratioOf(quiz.options[0])}
		style:--r2={ratioOf(quiz.options[1])}
		style:--r3={ratioOf(quiz.options[2])}
		style:--r4={ratioOf(quiz.options[3])}
		style:--ratio-sum={quiz.options.reduce((sum, option) => sum + ratioOf(option), 0)}
		class="tiles-frame"
	>
		<ol class="tiles" aria-label={m.review.quiz.options}>
			{#each quiz.options as option, index (option.artwork?.id ?? option.label)}
				{@const image = option.artwork?.image}
				{@const imageAlt =
					answered && option.artwork ? describe(option.artwork) : m.review.quiz.imageAlt(index + 1)}
				<li
					style:--artwork-ratio={ratioOf(option)}
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
					{#if image?.src}
						<button
							class="zoom"
							aria-label={m.review.quiz.openImage(index + 1)}
							onclick={() => enlarge(image, imageAlt)}
							type="button"
						>
							<Icon icon={Maximize2} size="sm" />
						</button>
					{/if}
					<p class="tile-caption">
						{#if answered}
							<cite class="artwork-title">{option.label}</cite>
							<span class="caption">{optionDetails(option)}</span>
						{/if}
					</p>
				</li>
			{/each}
		</ol>
	</div>
{/snippet}

{#snippet pinMark()}
	{#if pin}
		<PinMark label="?" x={pin.x} y={pin.y} />
	{/if}
{/snippet}

<ReviewCard
	actions={next}
	{alt}
	{artwork}
	compact
	credit={answered ? credit : undefined}
	image={pin ? artworkImageSource(pin.image, STAGE_WIDTH) : artwork.image}
	labelledby="quiz-heading"
	overlay={pin ? pinMark : undefined}
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
				{:else if item.mode === 'quiz_pin'}
					{m.review.quiz.pinQuestion}
				{:else}
					{m.review.quiz.titleQuestion}
				{/if}
			</h1>
			{#if item.mode === 'quiz_image'}
				<p class="lead">{m.review.quiz.imageHint}</p>
			{:else if item.mode === 'quiz_style'}
				<p class="lead">{m.review.quiz.styleHint}</p>
			{:else if item.mode === 'quiz_pin'}
				<p class="lead">{m.review.quiz.pinHint}</p>
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
							{@render optionState(index)}
						</button>
					</li>
				{/each}
			</ol>
		{/if}
		{@render feedback()}
	{/snippet}
</ReviewCard>

<ImageViewer bind:this={viewer} alt={viewed?.alt ?? ''} image={viewed?.image} />

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

	.options {
		display: grid;
		gap: var(--spacing-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.tiles-frame {
		--tile-gap: var(--spacing-6);
		--tile-band: calc(
			var(--spacing-2) + var(--font-size-lg) * var(--line-height-lg) + var(--spacing-1) +
				var(--font-size-xs) * var(--line-height-xs) + var(--spacing-3)
		);
		--tile-chrome-x: calc(2 * var(--spacing-2) + 2 * var(--border-width-button));
		--tile-chrome-y: calc(var(--spacing-2) + var(--tile-band) + 2 * var(--border-width-button));
		--tile-image-width: calc((100cqw - var(--tile-gap)) / 2 - var(--tile-chrome-x));
		--h1: calc(var(--tile-image-width) / var(--r1) + var(--tile-chrome-y));
		--h2: calc(var(--tile-image-width) / var(--r2) + var(--tile-chrome-y));
		--h3: calc(var(--tile-image-width) / var(--r3) + var(--tile-chrome-y));
		--h4: calc(var(--tile-image-width) / var(--r4) + var(--tile-chrome-y));

		container-type: inline-size;
		width: 100%;
	}

	.tiles {
		position: relative;
		height: calc(max(var(--h1) + var(--h3), var(--h2) + var(--h4)) + var(--tile-gap));
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.tile {
		position: absolute;
		display: grid;
		padding: var(--spacing-2) var(--spacing-2) 0;
		border: var(--border-width-button) solid transparent;
		background: var(--color-mat-bg);
		color: var(--color-mat-fg);
	}

	.tile:nth-child(1) {
		top: 0;
		left: 0;
	}

	.tile:nth-child(2) {
		top: 0;
		right: 0;
	}

	.tile:nth-child(3) {
		top: calc(var(--h1) + var(--tile-gap));
		left: 0;
	}

	.tile:nth-child(4) {
		top: calc(var(--h2) + var(--tile-gap));
		right: 0;
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

	.zoom {
		position: absolute;
		top: calc(2 * var(--spacing-2));
		right: calc(2 * var(--spacing-2));
		z-index: 2;
		display: grid;
		place-items: center;
		width: var(--spacing-8);
		height: var(--spacing-8);
		padding: 0;
		border: none;
		background: var(--color-mat-badge-bg);
		color: var(--color-mat-badge-fg);
		cursor: var(--cursor-zoom-in);
	}

	.window :global(img) {
		display: block;
		width: var(--tile-image-width);
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
		padding: var(--spacing-2) var(--spacing-3);
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

	@media (min-width: 768px) {
		.tiles-frame {
			--tile-gap: var(--spacing-4);
			--tile-height: min(
				100cqh - var(--tile-chrome-y),
				(100cqw - 3 * var(--tile-gap) - 4 * var(--tile-chrome-x)) / var(--ratio-sum)
			);
		}

		.tiles {
			display: flex;
			justify-content: center;
			align-items: flex-start;
			gap: var(--tile-gap);
			height: auto;
		}

		.tile {
			position: relative;
		}

		.tile:nth-child(n) {
			inset: auto;
		}

		.window :global(img) {
			width: calc(var(--tile-height) * var(--artwork-ratio));
		}
	}
</style>
