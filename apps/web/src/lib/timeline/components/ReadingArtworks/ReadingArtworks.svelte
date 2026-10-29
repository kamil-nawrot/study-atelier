<script lang="ts">
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { READING_TITLES } from '#lib/timeline/reading/reading.ts';

	type Props = {
		artworks: WallArtwork[];
		onchoose: (artwork: WallArtwork) => void;
	};

	let { artworks, onchoose }: Props = $props();
</script>

<div class="reading-artworks">
	{#if artworks.length > 0}
		<span class="caption label">{m.timeline.readingArtworks}</span>
		<ul class="titles">
			{#each artworks.slice(0, READING_TITLES) as artwork (artwork.id)}
				<li>
					<button class="title" onclick={() => onchoose(artwork)} type="button">
						<cite>{artwork.title}</cite>
					</button>
				</li>
			{/each}
		</ul>
		{#if artworks.length > READING_TITLES}
			<span class="caption more">{m.timeline.readingMore(artworks.length - READING_TITLES)}</span>
		{/if}
	{:else}
		<span class="caption">{m.timeline.readingArtworksNone}</span>
	{/if}
</div>

<style>
	.reading-artworks {
		display: flex;
		align-items: baseline;
		gap: var(--spacing-2);
		box-sizing: border-box;
		min-width: 0;
		height: calc(var(--line-height-md) + 2 * var(--spacing-2));
		margin: calc(-1 * var(--spacing-2));
		padding: var(--spacing-2);
		overflow: hidden;
		white-space: nowrap;
	}

	.label,
	.more {
		flex: none;
	}

	.titles {
		display: flex;
		gap: var(--spacing-3);
		min-width: 0;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.titles li {
		min-width: 0;
	}

	.title {
		max-width: 100%;
		padding: 0;
		overflow: hidden;
		border: 0;
		background: none;
		color: var(--color-fg);
		font: inherit;
		text-overflow: ellipsis;
		cursor: pointer;
	}

	.title:hover cite {
		text-decoration: underline;
	}
</style>
