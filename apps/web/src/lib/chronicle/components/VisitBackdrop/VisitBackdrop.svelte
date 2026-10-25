<script lang="ts">
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

	type Props = {
		artwork: WallArtwork;
		onnearscreen?: (artwork: WallArtwork) => void;
		onimagefailed?: (artwork: WallArtwork) => void;
	};

	let { artwork, onnearscreen, onimagefailed }: Props = $props();

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

<span class="backdrop" {@attach watchScreen} aria-hidden="true">
	{#if artwork.image && !artwork.imageUnavailable}
		<img alt="" loading="lazy" onerror={() => onimagefailed?.(artwork)} src={artwork.image.src} />
	{/if}
</span>

<style>
	.backdrop {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	img {
		display: block;
		width: 100%;
		height: 100%;
		opacity: 0.3;
		object-fit: cover;
	}
</style>
