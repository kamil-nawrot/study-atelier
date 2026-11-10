<script lang="ts">
	import { Alert, ArtworkTile, SearchField } from '@study-atelier/ui';
	import { onMount } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { eraIcon, eraName } from '#lib/catalogue/eras/eras.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import { compareHref } from '#lib/compare/compare-address/compare-address.ts';
	import { filterForComparison } from '#lib/compare/compare-search/compare-search.ts';
	import type { CompareSides } from '#lib/compare/types/compare-sides.ts';
	import {
		NO_IMAGE_RATIO,
		WALL_PART,
		WIDE_MIN_WIDTH,
		distribute
	} from '#lib/wall/masonry/masonry.ts';
	import { WallImages } from '#lib/wall/wall-images/wall-images.svelte.ts';
	import { loadAtelier } from '#lib/wall/wall-data/wall-data.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		sides: CompareSides;
		empty: keyof CompareSides;
		other?: { title: string };
	};

	let { sides, empty, other }: Props = $props();

	const COLUMNS = 3;
	const NARROW_COLUMNS = 2;

	const images = new WallImages();
	const wide = new MediaQuery(`min-width: ${WIDE_MIN_WIDTH}px`);

	let artworks = $state<WallArtwork[]>();
	let error = $state<string>();
	let query = $state('');
	let rendered = $state(WALL_PART);

	let matching = $derived(
		filterForComparison(images.apply(artworks ?? []), query, [sides.left, sides.right])
	);
	let shown = $derived(matching.slice(0, rendered));
	let columns = $derived(
		distribute(shown, wide.current ? COLUMNS : NARROW_COLUMNS, (artwork) =>
			artwork.image ? artwork.image.height / artwork.image.width : NO_IMAGE_RATIO
		)
	);

	onMount(async () => {
		const result = await loadAtelier();
		artworks = result.artworks;
		error = result.error;
	});

	$effect(() => {
		void query;
		rendered = WALL_PART;
	});

	function hrefOf(artwork: WallArtwork): string {
		return compareHref({ ...sides, [empty]: artwork.number });
	}

	function watchScreen(artwork: WallArtwork): (element: HTMLElement) => (() => void) | void {
		return (element) => {
			if (!artwork.pendingImage) return;
			const observer = new IntersectionObserver(([entry]) => {
				if (!entry.isIntersecting) return;
				observer.disconnect();
				images.request(artwork);
			});
			observer.observe(element);
			return () => observer.disconnect();
		};
	}

	function watchEnd(element: HTMLElement): () => void {
		const observer = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting) rendered += WALL_PART;
		});
		observer.observe(element);
		return () => observer.disconnect();
	}
</script>

<section class="picker" data-sveltekit-replacestate>
	{#if other}
		<h2>{m.compare.questionLead} <cite class="artwork-title">{other.title}</cite>?</h2>
	{:else}
		<h2>{m.compare.questionEmpty}</h2>
	{/if}
	<SearchField label={m.compare.search} placeholder={m.compare.search} bind:value={query} />
	{#if error}
		<Alert title={m.atelier.loadErrorTitle} tone="danger">
			{error}
		</Alert>
	{:else if artworks === undefined}
		<p class="note">{m.compare.loadingAtelier}</p>
	{:else if matching.length === 0}
		<div class="note">
			<h3>{m.atelier.noResultsTitle}</h3>
			<p>{m.atelier.noResults(query.trim())}</p>
		</div>
	{:else}
		<div class="tiles">
			{#each columns as column, index (index)}
				<ul class="column">
					{#each column as artwork (artwork.id)}
						<li {@attach watchScreen(artwork)}>
							<ArtworkTile
								authors={artwork.authors}
								date={artwork.date}
								href={hrefOf(artwork)}
								image={artwork.image}
								imageUnavailable={artwork.imageUnavailable}
								mark={artwork.eraCode ? eraIcon(artwork.eraCode) : undefined}
								markLabel={artwork.eraCode ? eraName(artwork.eraCode) : undefined}
								number={artwork.number}
								onimagefailed={() => images.failed(artwork)}
								title={artwork.title}
							/>
						</li>
					{/each}
				</ul>
			{/each}
		</div>
		{#if rendered < matching.length}
			{#key rendered}
				<div {@attach watchEnd}></div>
			{/key}
		{/if}
	{/if}
</section>

<style>
	.picker {
		display: grid;
		align-content: start;
		gap: var(--spacing-4);
		min-width: 0;
		padding: var(--spacing-6) var(--spacing-4);
		background: var(--color-bg);
		color: var(--color-fg);
	}

	h2 {
		margin: 0;
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-lg);
	}

	.note {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.note h3,
	.note p {
		margin: 0;
	}

	.tiles {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-4);
	}

	.column {
		display: grid;
		flex: 1;
		gap: var(--spacing-4);
		min-width: 0;
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>
