<script lang="ts">
	import { ArtworkImage, NoImage } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

	type Props = {
		artworks: WallArtwork[];
		more: number;
		onnearscreen?: (artwork: WallArtwork) => void;
		onimagefailed?: (artwork: WallArtwork) => void;
	};

	let { artworks, more, onnearscreen, onimagefailed }: Props = $props();

	function watchScreen(artwork: WallArtwork): (element: HTMLElement) => (() => void) | void {
		return (element) => {
			if (!artwork.pendingImage) return;
			const observer = new IntersectionObserver(([entry]) => {
				if (!entry.isIntersecting) return;
				observer.disconnect();
				onnearscreen?.(artwork);
			});
			observer.observe(element);
			return () => observer.disconnect();
		};
	}
</script>

<ul class="thumbnails">
	{#each artworks as artwork (artwork.id)}
		<li class="mat" {@attach watchScreen(artwork)}>
			{#if artwork.hasImage}
				<ArtworkImage
					alt={[artwork.title, ...artwork.authors].join(', ')}
					height={artwork.image?.height}
					onfailed={() => onimagefailed?.(artwork)}
					src={artwork.image?.src}
					unavailable={artwork.imageUnavailable}
					width={artwork.image?.width}
				/>
			{:else}
				<NoImage />
			{/if}
		</li>
	{/each}
	{#if more > 0}
		<li class="more caption">
			<span aria-hidden="true">{m.chronicle.more(more)}</span>
			<span class="visually-hidden">{m.chronicle.moreLabel(more)}</span>
		</li>
	{/if}
</ul>

<style>
	.thumbnails {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: var(--spacing-2);
		min-width: 0;
		padding: 0;
		list-style: none;
	}

	.mat {
		--thumbnail-height: 64px;

		flex: none;
		height: var(--thumbnail-height);
		padding: var(--spacing-1);
		background: var(--color-mat-bg);
	}

	.mat :global(img),
	.mat > :global(*) {
		width: auto;
		height: 100%;
	}

	.mat :global(img) {
		display: block;
		max-width: calc(var(--thumbnail-height) * 2);
		object-fit: cover;
	}

	.more {
		flex: none;
		font-variant-numeric: tabular-nums;
	}

	@media (min-width: 768px) {
		.mat {
			--thumbnail-height: 88px;
		}
	}
</style>
