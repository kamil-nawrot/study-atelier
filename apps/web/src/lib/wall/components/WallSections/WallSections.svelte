<script lang="ts">
	import { Disclosure } from '@study-atelier/ui';
	import { eraIcon } from '#lib/catalogue/eras/eras.ts';
	import { allocateTiles } from '#lib/wall/grouping/grouping.ts';
	import { WALL_MARGIN, WALL_PART } from '#lib/wall/masonry/masonry.ts';
	import ArtworkWall from '#lib/wall/components/ArtworkWall/ArtworkWall.svelte';
	import type { WallSection } from '#lib/wall/types/wall-section.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';

	type Props = {
		sections: WallSection[];
		collapsed: ReadonlySet<string>;
		highlight?: number;
		inset?: number;
		element?: HTMLElement;
		rendered?: number;
		ontoggle: (key: string, open: boolean) => void;
		onfavourite?: (artwork: WallArtwork) => void;
		onimagefailed?: (artwork: WallArtwork) => void;
		onnearscreen?: (artwork: WallArtwork) => void;
	};

	let {
		sections,
		collapsed,
		highlight,
		inset = 0,
		element = $bindable(),
		rendered = $bindable(WALL_PART),
		ontoggle,
		onfavourite,
		onimagefailed,
		onnearscreen
	}: Props = $props();

	const HEADING_LEVELS = [2, 3, 4] as const;

	let budget = $derived(allocateTiles(sections, collapsed, rendered));

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

{#snippet section(item: WallSection, railIndex?: number)}
	{#if budget.shown.has(item.key)}
		<section class="section level-{item.level}" data-period={railIndex}>
			<Disclosure
				count={item.artworks.length}
				icon={item.code ? eraIcon(item.code) : undefined}
				lazy
				level={HEADING_LEVELS[item.level - 1]}
				muted={item.level === 3}
				ontoggle={(open) => ontoggle(item.key, open)}
				open={!collapsed.has(item.key)}
				title={item.name}
			>
				{#if item.sections.length > 0}
					<div class="sections">
						{#each item.sections as child (child.key)}
							{@render section(child)}
						{/each}
					</div>
				{:else}
					<ArtworkWall
						artworks={item.artworks.slice(0, budget.shown.get(item.key))}
						{highlight}
						{inset}
						{onfavourite}
						{onimagefailed}
						{onnearscreen}
						rendered={item.artworks.length}
					/>
				{/if}
			</Disclosure>
		</section>
	{/if}
{/snippet}

<div bind:this={element} class="sections top">
	{#each sections as item, index (item.key)}
		{@render section(item, index)}
	{/each}
</div>
{#if !budget.complete}
	{#key rendered}
		<div {@attach watchEnd}></div>
	{/key}
{/if}

<style>
	.sections {
		display: grid;
		gap: var(--spacing-8);
	}

	.top {
		gap: var(--spacing-8);
	}

	.top > .section {
		padding-top: var(--spacing-8);
		border-top: var(--border-width-hairline) solid var(--color-tag);
	}

	.level-1 .sections {
		margin-top: var(--spacing-2);
	}

	.level-2 .sections {
		gap: var(--spacing-6);
	}
</style>
