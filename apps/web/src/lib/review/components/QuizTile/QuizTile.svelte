<script lang="ts">
	import Maximize2 from '@lucide/svelte/icons/maximize-2';
	import { ArtworkImage, Icon, Tooltip } from '@study-atelier/ui';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import QuizChoiceState from '#lib/review/components/QuizChoiceState/QuizChoiceState.svelte';
	import QuizMark from '#lib/review/components/QuizMark/QuizMark.svelte';
	import { authorsOf, describeArtwork } from '#lib/review/overview/overview.ts';
	import { QUIZ_TILE_SIZES } from '#lib/review/quiz/quiz.ts';
	import type { QuizOption } from '#lib/review/types/quiz-option.ts';

	type Props = {
		option: QuizOption;
		index: number;
		answer: number;
		ratio: number;
		chosen?: number;
		saving: boolean;
		onanswer: (choice: number) => void;
		onenlarge: (image: WallArtwork['image'], alt: string) => void;
	};

	let { option, index, answer, ratio, chosen, saving, onanswer, onenlarge }: Props = $props();

	let answered = $derived(chosen !== undefined);
	let image = $derived(option.artwork?.image);
	let imageAlt = $derived(
		answered && option.artwork ? describeArtwork(option.artwork) : m.review.quiz.imageAlt(index + 1)
	);
	let details = $derived(
		option.artwork
			? [
					authorsOf(option.artwork),
					option.artwork.date,
					option.reason ? m.review.quiz.reasons[option.reason] : undefined
				]
					.filter(Boolean)
					.join(' · ')
			: ''
	);
	let fullCaption = $derived([option.label, details].filter(Boolean).join(' · '));
</script>

<li
	style:--artwork-ratio={ratio}
	class="tile"
	class:muted={answered && index !== answer && index !== chosen}
	class:right={answered && index === answer}
	class:wrong={answered && index === chosen && chosen !== answer}
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
			<span class="badge" aria-hidden="true"><QuizMark {answer} {chosen} {index} /></span>
		</span>
		<QuizChoiceState {answer} {chosen} {index} />
	</button>
	{#if image?.src}
		<button
			class="zoom"
			aria-label={m.review.quiz.openImage(index + 1)}
			onclick={() => onenlarge(image, imageAlt)}
			type="button"
		>
			<Icon icon={Maximize2} size="sm" />
		</button>
	{/if}
	<p class="tile-caption">
		{#if answered}
			<Tooltip text={fullCaption}>
				<span class="caption-lines">
					<cite class="artwork-title">{option.label}</cite>
					<span class="caption">{details}</span>
				</span>
			</Tooltip>
		{/if}
	</p>
</li>

<style>
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

	.pick:disabled {
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

	.tile-caption > :global(.tooltip) {
		display: grid;
		min-width: 0;
	}

	.caption-lines {
		display: grid;
		gap: var(--spacing-1);
		min-width: 0;
	}

	.caption-lines .artwork-title {
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	.caption-lines .caption {
		overflow: hidden;
		color: var(--color-mat-fg-muted);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (min-width: 768px) {
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
