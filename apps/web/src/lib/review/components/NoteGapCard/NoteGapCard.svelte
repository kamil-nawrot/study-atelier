<script lang="ts">
	import ImageIcon from '@lucide/svelte/icons/image';
	import StickyNote from '@lucide/svelte/icons/sticky-note';
	import type { Snippet } from 'svelte';
	import { ArtworkImage, Icon, NoImage, StageBackdrop } from '@study-atelier/ui';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		artwork: WallArtwork;
		answered: boolean;
		note: Snippet;
	};

	let { artwork, answered, note }: Props = $props();

	let flipped = $state(false);

	$effect(() => {
		void artwork.id;
		if (answered) flipped = false;
	});
</script>

<div class="card" class:flipped>
	{#if flipped}
		<div class="artwork">
			{#if artwork.image?.src}
				<StageBackdrop src={artwork.image.src} />
				<ArtworkImage
					alt={artwork.title}
					height={artwork.image.height}
					loading="eager"
					sizes="100vw"
					src={artwork.image.src}
					srcset={artwork.image.srcset}
					width={artwork.image.width}
				/>
			{:else if artwork.imageUnavailable}
				<ArtworkImage alt={artwork.title} unavailable />
			{:else}
				<span class="window"><NoImage /></span>
			{/if}
		</div>
	{:else}
		{@render note()}
	{/if}
	<button
		class="flip"
		aria-label={m.review.quiz.showArtwork}
		aria-pressed={flipped}
		onclick={() => (flipped = !flipped)}
		type="button"
	>
		<Icon icon={flipped ? StickyNote : ImageIcon} size="sm" />
	</button>
</div>

<style>
	.card {
		position: relative;
		display: grid;
		width: 100%;
		min-height: calc(3 * var(--size-control));
		padding: var(--spacing-4) calc(var(--size-control) + var(--spacing-2)) var(--spacing-4)
			var(--spacing-4);
		background: var(--color-surface);
		color: var(--color-fg);
		text-align: start;
	}

	.flipped {
		place-items: center;
		padding: var(--spacing-3);
		background: var(--color-mat-bg);
	}

	.artwork {
		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		overflow: hidden;
	}

	.artwork :global(.artwork-image) {
		position: relative;
	}

	.artwork :global(.artwork-image img) {
		display: block;
		width: auto;
		max-width: 100%;
		height: auto;
		max-height: 50svh;
		background: var(--color-mat-window);
	}

	.window {
		display: grid;
		width: calc(5 * var(--size-control));
		aspect-ratio: 4 / 5;
	}

	.flip {
		position: absolute;
		top: 0;
		right: 0;
		display: grid;
		place-items: center;
		width: var(--size-control);
		height: var(--size-control);
		padding: 0;
		border: none;
		background: transparent;
		color: var(--color-fg-muted);
		cursor: pointer;
	}

	.flipped .flip {
		color: var(--color-mat-fg);
	}

	.flip:focus-visible {
		outline: var(--border-width-base) dashed currentcolor;
		outline-offset: calc(-1 * var(--border-width-base) * 2);
	}
</style>
