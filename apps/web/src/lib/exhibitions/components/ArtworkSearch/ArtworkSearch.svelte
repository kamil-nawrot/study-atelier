<script lang="ts">
	import { onMount } from 'svelte';
	import { NoImage, SearchField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		loadRecentArtworks,
		searchArtworks
	} from '#lib/exhibitions/exhibition-artworks-data/exhibition-artworks-data.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import type { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';

	type Props = {
		lookup: ArtworkLookup;
		onpick: (artworkId: string) => void;
		ondrag?: (event: PointerEvent, artworkId: string) => void;
	};

	const SEARCH_DELAY_MS = 250;

	let { lookup, onpick, ondrag }: Props = $props();

	let query = $state('');
	let recent = $state<string[]>([]);
	let found = $state<string[]>();
	let error = $state<string>();

	let phrase = $derived(query.trim());
	let shown = $derived((phrase.length >= 2 ? found : recent) ?? []);
	let artworks = $derived(shown.flatMap((id) => lookup.get(id) ?? []));
	let status = $derived.by(() => {
		if (phrase.length < 2) return m.exhibitions.panel.recent;
		if (found === undefined) return '';
		return found.length > 0 ? m.exhibitions.panel.found(found.length) : m.exhibitions.panel.noMatch;
	});

	onMount(async () => {
		const result = await loadRecentArtworks();
		lookup.add(result.artworks);
		recent = result.artworks.map((artwork) => artwork.id);
		error = result.error;
	});

	$effect(() => {
		const text = phrase;
		if (text.length < 2) {
			found = undefined;
			return;
		}
		const controller = new AbortController();
		const timer = setTimeout(async () => {
			const result = await searchArtworks(text, controller.signal);
			if (controller.signal.aborted) return;
			lookup.add(result.artworks);
			found = result.artworks.map((artwork) => artwork.id);
			error = result.error;
		}, SEARCH_DELAY_MS);
		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	});

	function image(artwork: WallArtwork): string | undefined {
		return artwork.image?.src;
	}
</script>

<SearchField
	label={m.exhibitions.panel.search}
	placeholder={m.exhibitions.panel.searchPlaceholder}
	bind:value={query}
/>
{#if error}
	<p class="caption">{m.exhibitions.panel.loadError}</p>
{:else}
	<p class="caption">{status}</p>
{/if}
<ul class="tiles">
	{#each artworks as artwork (artwork.id)}
		<li>
			<button
				class="tile"
				onclick={() => onpick(artwork.id)}
				onpointerdown={(event) => ondrag?.(event, artwork.id)}
				type="button"
			>
				<span class="thumbnail">
					{#if image(artwork)}
						<img alt="" draggable="false" loading="lazy" src={image(artwork)} />
					{:else}
						<NoImage />
					{/if}
				</span>
				<span class="title">{artwork.title}</span>
			</button>
		</li>
	{/each}
</ul>

<style>
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(calc(6 * var(--spacing-6)), 1fr));
		gap: var(--spacing-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.tile {
		display: grid;
		gap: var(--spacing-2);
		width: 100%;
		padding: 0;
		border: none;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: start;
		cursor: grab;
	}

	.thumbnail {
		display: grid;
		aspect-ratio: 4 / 5;
		place-items: center;
		overflow: hidden;
		background: var(--color-mat-window);
	}

	.thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.title {
		overflow: hidden;
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
