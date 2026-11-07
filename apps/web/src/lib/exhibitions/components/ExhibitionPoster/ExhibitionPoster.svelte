<script lang="ts">
	import { NoImage } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import { m } from '#lib/i18n/i18n.ts';
	import { changedOn } from '#lib/exhibitions/exhibition-dates/exhibition-dates.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import type { ExhibitionSummary } from '#lib/exhibitions/types/exhibition-summary.ts';

	type Props = {
		exhibition: ExhibitionSummary;
		cover?: WallArtwork;
		onimagefailed?: (artwork: WallArtwork) => void;
	};

	let { exhibition, cover, onimagefailed }: Props = $props();
</script>

<a class="poster" href={resolve('/(app)/atelier/exhibitions/[id]', { id: exhibition.id })}>
	<span class="cover">
		{#if cover?.image?.src}
			<img
				alt=""
				loading="lazy"
				onerror={() => onimagefailed?.(cover)}
				sizes="(min-width: 768px) 400px, 100vw"
				src={cover.image.src}
				srcset={cover.image.srcset}
			/>
		{:else}
			<NoImage />
		{/if}
	</span>
	<span class="title">{exhibition.title}</span>
	<span class="meta">
		{m.exhibitions.posterMeta(exhibition.artworkCount, changedOn(exhibition.updatedAt))}
	</span>
</a>

<style>
	.poster {
		display: grid;
		align-content: start;
		gap: var(--spacing-2);
		color: inherit;
		text-decoration: none;
	}

	.cover {
		display: grid;
		aspect-ratio: 4 / 5;
		place-items: center;
		overflow: hidden;
		background: var(--color-mat-window);
	}

	.cover img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.title {
		font-family: var(--font-family-title), Georgia, serif;
		font-size: var(--font-size-xl);
		font-style: italic;
		line-height: var(--line-height-xl);
	}

	.meta {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.poster:hover .title {
		text-decoration: underline;
	}

	.poster:focus-visible {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: var(--spacing-2);
	}
</style>
