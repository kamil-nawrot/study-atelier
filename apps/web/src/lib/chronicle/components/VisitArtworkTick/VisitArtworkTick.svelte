<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import { ArtworkImage, Icon, NoImage } from '@study-atelier/ui';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

	type Props = {
		artwork: WallArtwork;
		checked: boolean;
		ontoggle: (artwork: WallArtwork) => void;
		onnearscreen?: (artwork: WallArtwork) => void;
	};

	let { artwork, checked, ontoggle, onnearscreen }: Props = $props();

	function watchScreen(element: HTMLElement): (() => void) | void {
		if (!artwork.pendingImage) return;
		const observer = new IntersectionObserver(([entry]) => {
			if (!entry.isIntersecting) return;
			observer.disconnect();
			onnearscreen?.(artwork);
		});
		observer.observe(element);
		return () => observer.disconnect();
	}
</script>

<label class="tick" class:off={!checked} {@attach watchScreen}>
	<input class="visually-hidden" {checked} onchange={() => ontoggle(artwork)} type="checkbox" />
	<span class="window">
		{#if artwork.hasImage}
			<ArtworkImage
				alt=""
				height={artwork.image?.height}
				src={artwork.image?.src}
				surface="frame"
				unavailable={artwork.imageUnavailable}
				width={artwork.image?.width}
			/>
		{:else}
			<NoImage />
		{/if}
		<span class="mark" aria-hidden="true">
			{#if checked}
				<Icon icon={Check} size="sm" />
			{/if}
		</span>
	</span>
	<cite class="title">{artwork.title}</cite>
</label>

<style>
	.tick {
		display: grid;
		align-content: start;
		gap: var(--spacing-2);
		min-width: 0;
		padding: var(--spacing-2) var(--spacing-2) var(--spacing-3);
		background: var(--color-mat-bg);
		color: var(--color-mat-fg);
		cursor: pointer;
	}

	.tick:has(input:focus-visible) {
		outline: var(--border-width-heavy) dashed var(--color-fg);
		outline-offset: var(--spacing-1);
	}

	.window {
		position: relative;
		display: block;
		aspect-ratio: 1;
		overflow: hidden;
		background: var(--color-mat-window);
	}

	.window > :global(*) {
		width: 100%;
		height: 100%;
	}

	.window :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.mark {
		position: absolute;
		top: var(--spacing-1);
		right: var(--spacing-1);
		display: grid;
		place-items: center;
		width: var(--spacing-6);
		height: var(--spacing-6);
		border: var(--border-width-hairline) solid var(--color-mat-badge-fg);
		background: var(--color-mat-badge-bg);
		color: var(--color-mat-badge-fg);
	}

	.tick:not(.off) .mark {
		border-color: var(--color-mat-fg);
		background: var(--color-mat-fg);
		color: var(--color-mat-bg);
	}

	.title {
		display: -webkit-box;
		overflow: hidden;
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-sm);
		font-style: italic;
		line-height: var(--line-height-sm);
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
	}

	@media (prefers-reduced-motion: no-preference) {
		.window :global(img) {
			transition: opacity var(--duration-short);
		}
	}

	.off .window :global(img),
	.off .title {
		opacity: 0.4;
	}
</style>
