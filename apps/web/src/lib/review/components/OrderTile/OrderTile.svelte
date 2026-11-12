<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import X from '@lucide/svelte/icons/x';
	import { ArtworkImage, Icon } from '@study-atelier/ui';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import type { OrderPlace } from '#lib/review/order-guess/order-guess.ts';
	import ImageBackdrop from '#lib/review/components/ImageBackdrop/ImageBackdrop.svelte';
	import { describeArtwork } from '#lib/review/overview/overview.ts';
	import { yearsOf } from '#lib/review/year-guess/year-guess.ts';

	type Props = {
		artwork: WallArtwork;
		index: number;
		place?: OrderPlace;
		number?: number | null;
	};

	let { artwork, index, place, number = index + 1 }: Props = $props();

	let image = $derived(artwork.image);
	let alt = $derived(place ? describeArtwork(artwork) : m.review.order.imageAlt);
	let years = $derived(yearsOf(artwork));
	let yearText = $derived(
		years
			? years[0] === years[1]
				? m.atelier.year(years[0], false)
				: m.atelier.span(years[0], years[1], false)
			: ''
	);
</script>

<span class="tile" class:right={place?.right} class:wrong={place && !place.right}>
	<span class="window">
		{#if image?.src}
			<ImageBackdrop src={image.src} />
			<ArtworkImage
				{alt}
				height={image.height}
				loading="eager"
				sizes="(min-width: 768px) 25vw, 45vw"
				src={image.src}
				srcset={image.srcset}
				width={image.width}
			/>
		{:else}
			<ArtworkImage {alt} unavailable />
		{/if}
		<span class="badge" class:empty={number === null && !place} aria-hidden="true">
			{#if place?.right}
				<Icon icon={Check} size="sm" />
			{:else if place}
				<Icon icon={X} size="sm" />
			{:else if number !== null}
				{number}
			{/if}
		</span>
	</span>
	{#if place}
		<span class="caption">
			<span class="year">{yearText}</span>
			{#if !place.right}
				<span>{m.review.order.shouldBe(place.place + 1)}</span>
			{/if}
		</span>
	{:else}
		<span class="grip" aria-hidden="true" data-grip>
			<Icon icon={GripVertical} size="sm" />
		</span>
	{/if}
</span>

<style>
	.tile {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--spacing-2);
		padding: var(--spacing-2);
		border: var(--border-width-button) solid transparent;
		background: var(--color-mat-bg);
		color: var(--color-mat-fg);
	}

	.right {
		border-color: var(--color-success);
	}

	.wrong {
		border-color: var(--color-danger);
	}

	.window {
		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	.window :global(.artwork-image) {
		position: relative;
	}

	.window :global(img) {
		display: block;
		width: auto;
		max-width: 100%;
		height: auto;
		max-height: 18dvh;
		background: var(--color-mat-window);
	}

	.badge.empty {
		display: none;
	}

	.badge {
		position: absolute;
		top: var(--spacing-2);
		left: var(--spacing-2);
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

	.caption {
		display: grid;
		color: var(--color-mat-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.year {
		color: var(--color-mat-fg);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.grip {
		display: grid;
		place-items: center;
		padding: var(--spacing-2) 0;
		color: var(--color-mat-fg-muted);
		cursor: grab;
		touch-action: none;
	}

	@media (min-width: 768px) {
		.tile {
			grid-template-columns: minmax(0, 1fr);
			cursor: grab;
		}

		.window :global(img) {
			max-height: calc(100cqh - var(--spacing-24) - var(--spacing-16));
		}

		.caption {
			justify-items: center;
		}

		.grip {
			display: none;
		}
	}
</style>
