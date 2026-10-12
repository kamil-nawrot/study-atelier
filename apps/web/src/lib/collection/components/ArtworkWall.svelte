<script lang="ts">
	import { ArtworkTile } from '@study-atelier/ui';
	import { MediaQuery } from 'svelte/reactivity';
	import { innerWidth } from 'svelte/reactivity/window';
	import { resolve } from '$app/paths';
	import { columnCount, distribute, NO_IMAGE_RATIO } from '../masonry.ts';
	import type { WallArtwork } from '../types.ts';

	type Props = {
		artworks: WallArtwork[];
		highlight?: number;
	};

	let { artworks, highlight }: Props = $props();

	const wide = new MediaQuery('min-width: 768px');

	let columns = $derived(
		distribute(artworks, columnCount(wide.current, innerWidth.current ?? 0), (artwork) =>
			artwork.image ? artwork.image.height / artwork.image.width : NO_IMAGE_RATIO
		)
	);
</script>

<div class="wall">
	{#each columns as column, index (index)}
		<ul class="column">
			{#each column as artwork (artwork.id)}
				<li class:highlight={artwork.number === highlight}>
					<ArtworkTile
						authors={artwork.authors}
						date={artwork.date}
						href={resolve('/(app)/atelier/[number]', { number: String(artwork.number) })}
						image={artwork.image}
						number={artwork.number}
						title={artwork.title}
					/>
				</li>
			{/each}
		</ul>
	{/each}
</div>

<style>
	.wall {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-6);
	}

	.column {
		display: grid;
		flex: 1;
		gap: var(--spacing-6);
		min-width: 0;
		padding: 0;
		list-style: none;
	}

	li {
		outline: var(--border-width-button) solid transparent;
		outline-offset: var(--spacing-2);
	}

	li.highlight {
		outline-color: var(--color-fg);
	}

	@media (prefers-reduced-motion: no-preference) {
		li {
			transition: outline-color var(--duration-short) ease-out;
		}
	}
</style>
