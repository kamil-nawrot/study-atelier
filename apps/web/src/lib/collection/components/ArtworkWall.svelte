<script lang="ts">
	import { ArtworkTile } from '@study-atelier/ui';
	import { MediaQuery } from 'svelte/reactivity';
	import { innerWidth } from 'svelte/reactivity/window';
	import { resolve } from '$app/paths';
	import { eraIcon, eraName } from '../eras.ts';
	import {
		columnCount,
		distribute,
		NO_IMAGE_RATIO,
		WALL_MARGIN,
		WALL_PART,
		WIDE_MIN_WIDTH
	} from '../masonry.ts';
	import { m } from '#lib/i18n/index.ts';
	import type { WallArtwork } from '../types.ts';

	type Props = {
		artworks: WallArtwork[];
		highlight?: number;
		periodIndexes?: ReadonlyMap<string, number>;
		element?: HTMLElement;
		rendered?: number;
		onfavourite?: (artwork: WallArtwork) => void;
		onimagefailed?: (artwork: WallArtwork) => void;
		onnearscreen?: (artwork: WallArtwork) => void;
	};

	let {
		artworks,
		highlight,
		periodIndexes,
		element = $bindable(),
		rendered = $bindable(WALL_PART),
		onfavourite,
		onimagefailed,
		onnearscreen
	}: Props = $props();

	const wide = new MediaQuery(`min-width: ${WIDE_MIN_WIDTH}px`);

	let count = $derived(columnCount(wide.current, innerWidth.current ?? 0));
	let columns = $derived(
		distribute(artworks.slice(0, rendered), count, (artwork) =>
			artwork.image ? artwork.image.height / artwork.image.width : NO_IMAGE_RATIO
		)
	);

	function watchScreen(artwork: WallArtwork): (element: HTMLElement) => (() => void) | void {
		return (element) => {
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
		};
	}

	function watchEnd(element: HTMLElement): () => void {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) rendered += WALL_PART;
			},
			{ rootMargin: WALL_MARGIN }
		);
		observer.observe(element);
		return () => observer.disconnect();
	}
</script>

<div bind:this={element} class="wall">
	{#each columns as column, index (index)}
		<ul class="column">
			{#each column as artwork (artwork.id)}
				<li
					class:highlight={artwork.number === highlight}
					{@attach watchScreen(artwork)}
					data-period={periodIndexes?.get(artwork.id)}
				>
					<ArtworkTile
						authors={artwork.authors}
						date={artwork.date}
						favourite={artwork.favourite}
						favouriteLabel={artwork.favourite ? m.favourite.remove : m.favourite.add}
						href={resolve('/(app)/atelier/[number]', { number: String(artwork.number) })}
						image={artwork.image}
						imageUnavailable={artwork.imageUnavailable}
						mark={artwork.eraCode ? eraIcon(artwork.eraCode) : undefined}
						markLabel={artwork.eraCode ? eraName(artwork.eraCode) : undefined}
						number={artwork.number}
						onfavourite={onfavourite && (() => onfavourite(artwork))}
						onimagefailed={() => onimagefailed?.(artwork)}
						title={artwork.title}
					/>
				</li>
			{/each}
		</ul>
	{/each}
</div>
{#if rendered < artworks.length}
	{#key rendered}
		<div {@attach watchEnd}></div>
	{/key}
{/if}

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
