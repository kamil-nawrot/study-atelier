<script lang="ts">
	import { ArtworkImage, NoImage } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { WALL_MARGIN } from '#lib/wall/masonry/masonry.ts';
	import type { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';

	type Props = {
		artwork: WallArtwork;
		images: WallImages;
	};

	let { artwork, images }: Props = $props();

	function watchScreen(element: HTMLElement): (() => void) | void {
		if (!artwork.pendingImage) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				observer.disconnect();
				images.request(artwork);
			},
			{ rootMargin: WALL_MARGIN }
		);
		observer.observe(element);
		return () => observer.disconnect();
	}
</script>

<a
	class="thumb"
	{@attach watchScreen}
	aria-label={artwork.seen ? `${artwork.title}, ${m.map.city.seen}` : artwork.title}
	href={resolve('/(app)/atelier/[number]', { number: String(artwork.number) })}
	title={artwork.title}
>
	{#if artwork.hasImage}
		<ArtworkImage
			alt=""
			height={artwork.image?.height}
			onfailed={() => images.failed(artwork)}
			src={artwork.image?.src}
			surface="frame"
			unavailable={artwork.imageUnavailable}
			width={artwork.image?.width}
		/>
	{:else}
		<NoImage />
	{/if}
	{#if artwork.seen}
		<svg class="seen" aria-hidden="true" viewBox="0 0 2 2"><circle cx="1" cy="1" r="0.8" /></svg>
	{/if}
</a>

<style>
	.thumb {
		position: relative;
		display: block;
		width: var(--size-control);
		height: var(--size-control);
		overflow: hidden;
		background: var(--color-mat-bg);
	}

	.thumb :global(.artwork-image) {
		width: 100%;
		height: 100%;
	}

	.thumb :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.thumb:focus-visible {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: var(--spacing-1);
	}

	.seen {
		position: absolute;
		right: var(--spacing-1);
		bottom: var(--spacing-1);
		width: var(--spacing-4);
		height: var(--spacing-4);
	}

	.seen circle {
		fill: var(--color-highlight);
		stroke: var(--color-bg);
		stroke-width: 0.3;
	}
</style>
