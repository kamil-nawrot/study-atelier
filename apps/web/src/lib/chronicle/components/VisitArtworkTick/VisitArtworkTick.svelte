<script lang="ts">
	import { ArtworkImage, Checkbox, NoImage } from '@study-atelier/ui';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

	type Props = {
		artwork: WallArtwork;
		checked: boolean;
		ontoggle: (artwork: WallArtwork) => void;
		onnearscreen?: (artwork: WallArtwork) => void;
	};

	let { artwork, checked, ontoggle, onnearscreen }: Props = $props();

	const id = $props.id();

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

<div class="tick" class:off={!checked}>
	<label class="thumb" {@attach watchScreen} for={id}>
		{#if artwork.hasImage}
			<ArtworkImage
				alt=""
				height={artwork.image?.height}
				src={artwork.image?.src}
				unavailable={artwork.imageUnavailable}
				width={artwork.image?.width}
			/>
		{:else}
			<NoImage />
		{/if}
	</label>
	<Checkbox {id} {checked} label={artwork.title} onchange={() => ontoggle(artwork)} />
</div>

<style>
	.tick {
		display: grid;
		align-content: start;
		gap: var(--spacing-2);
		min-width: 0;
	}

	.thumb {
		display: block;
		aspect-ratio: 1;
		overflow: hidden;
		padding: var(--spacing-1);
		background: var(--color-mat-bg);
		cursor: pointer;
	}

	.thumb > :global(*) {
		width: 100%;
		height: 100%;
	}

	.thumb :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	@media (prefers-reduced-motion: no-preference) {
		.thumb {
			transition: opacity var(--duration-short);
		}
	}

	.off .thumb {
		opacity: 0.4;
	}
</style>
