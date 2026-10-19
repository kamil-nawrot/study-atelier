<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { Icon } from '@study-atelier/ui';
	import { eraIcon } from '../eras.ts';
	import { allocateTiles } from '../grouping.ts';
	import { WALL_MARGIN, WALL_PART } from '../masonry.ts';
	import ArtworkWall from './ArtworkWall.svelte';
	import type { WallArtwork, WallSection } from '../types.ts';

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
			<details
				ontoggle={(event) => ontoggle(item.key, event.currentTarget.open)}
				open={!collapsed.has(item.key)}
			>
				<summary>
					<svelte:element this={`h${item.level + 1}`} class="heading">
						{#if item.code}
							<Icon icon={eraIcon(item.code)} size={item.level === 1 ? 'md' : 'sm'} />
						{/if}
						{item.name}
						<span class="count">{item.artworks.length}</span>
					</svelte:element>
					<Icon icon={ChevronDown} size="sm" />
				</summary>
				{#if !collapsed.has(item.key)}
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
				{/if}
			</details>
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

	.level-3 .heading {
		color: var(--color-fg-muted);
		font-weight: var(--font-weight-medium);
	}

	.level-3 .count {
		outline: var(--border-width-hairline) solid var(--color-fg-muted);
		outline-offset: calc(-1 * var(--border-width-hairline));
		background: transparent;
		color: var(--color-fg-muted);
	}

	.level-1 .sections {
		margin-top: var(--spacing-2);
	}

	.level-2 .sections {
		gap: var(--spacing-6);
	}

	summary {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
		width: fit-content;
		list-style: none;
		cursor: pointer;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	details[open] > summary {
		margin-bottom: var(--spacing-4);
	}

	details[open] > summary > :global(svg) {
		rotate: 180deg;
	}

	.heading {
		display: flex;
		align-items: center;
		gap: var(--spacing-2);
	}

	.count {
		min-width: 16px;
		padding: 0 var(--spacing-1);
		background: var(--color-fg);
		color: var(--color-bg);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		line-height: var(--line-height-xs);
		text-align: center;
		font-variant-numeric: tabular-nums;
	}

	@media (prefers-reduced-motion: no-preference) {
		summary > :global(svg) {
			transition: rotate var(--duration-short) ease-out;
		}
	}
</style>
