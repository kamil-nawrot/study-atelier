<script lang="ts">
	import { ArtworkImage, NoImage } from '@study-atelier/ui';
	import TickTile from '#lib/shared/forms/TickTile/TickTile.svelte';
	import { WALL_MARGIN } from '#lib/wall/masonry/masonry.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

	type Props = {
		artwork: WallArtwork;
		checked: boolean;
		ontoggle: (artwork: WallArtwork) => void;
		onnearscreen?: (artwork: WallArtwork) => void;
		onimagefailed?: (artwork: WallArtwork) => void;
	};

	let { artwork, checked, ontoggle, onnearscreen, onimagefailed }: Props = $props();

	function watchScreen(element: HTMLElement): (() => void) | void {
		if (!artwork.pendingImage) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				observer.disconnect();
				onnearscreen?.(artwork);
			},
			{ rootMargin: WALL_MARGIN }
		);
		observer.observe(element);
		return () => observer.disconnect();
	}
</script>

<TickTile {checked} ontoggle={() => ontoggle(artwork)} {@attach watchScreen}>
	{#snippet picture()}
		{#if artwork.hasImage}
			<ArtworkImage
				alt=""
				height={artwork.image?.height}
				onfailed={() => onimagefailed?.(artwork)}
				src={artwork.image?.src}
				surface="frame"
				unavailable={artwork.imageUnavailable}
				width={artwork.image?.width}
			/>
		{:else}
			<NoImage />
		{/if}
	{/snippet}
	<cite class="title">{artwork.title}</cite>
</TickTile>

<style>
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
</style>
