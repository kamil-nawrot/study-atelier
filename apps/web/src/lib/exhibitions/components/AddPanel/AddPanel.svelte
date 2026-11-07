<script lang="ts">
	import { onMount } from 'svelte';
	import { NoImage, SearchField } from '@study-atelier/ui';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { m } from '#lib/i18n/i18n.ts';
	import {
		loadRecentArtworks,
		searchArtworks
	} from '#lib/exhibitions/exhibition-artworks-data/exhibition-artworks-data.ts';
	import FilterSidePanel from '#lib/wall/components/FilterSidePanel/FilterSidePanel.svelte';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import type {
		ArtworkKind,
		NewBlock,
		TextKind
	} from '#lib/exhibitions/editor/new-block/new-block.ts';
	import type { ArtworkLookup } from '#lib/exhibitions/artwork-lookup/artwork-lookup.svelte.ts';

	type Props = {
		open: boolean;
		lookup: ArtworkLookup;
		onadd: (block: NewBlock) => void;
		ondrag?: (event: PointerEvent, block: NewBlock) => void;
		addHref?: ResolvedPathname;
	};

	const SEARCH_DELAY_MS = 250;

	let { open = $bindable(), lookup, onadd, ondrag, addHref }: Props = $props();

	const kinds: { kind: TextKind; label: string }[] = [
		{ kind: 'textBlock', label: m.exhibitions.panel.paragraph },
		{ kind: 'heading', label: m.exhibitions.panel.heading },
		{ kind: 'quote', label: m.exhibitions.panel.quote }
	];

	const artworkKinds: { kind: ArtworkKind; label: string }[] = [
		{ kind: 'artwork', label: m.exhibitions.blocks.artwork },
		{ kind: 'palette', label: m.exhibitions.blocks.palette },
		{ kind: 'closeUp', label: m.exhibitions.blocks.closeUp }
	];

	let artworkKind = $state<ArtworkKind>('artwork');

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

<FilterSidePanel closeLabel={m.exhibitions.panel.close} title={m.exhibitions.panel.title} bind:open>
	<section class="section" aria-labelledby="panel-text">
		<h3 id="panel-text">{m.exhibitions.panel.textTitle}</h3>
		<div class="kinds">
			{#each kinds as { kind, label } (kind)}
				<button
					class="kind"
					onclick={() => onadd({ kind })}
					onpointerdown={(event) => ondrag?.(event, { kind })}
					type="button"
				>
					{label}
				</button>
			{/each}
		</div>
	</section>
	<section class="section" aria-labelledby="panel-artworks">
		<h3 id="panel-artworks">{m.exhibitions.panel.artworksTitle}</h3>
		<p id="panel-add-as" class="caption">{m.exhibitions.panel.addAs}</p>
		<div class="as" aria-labelledby="panel-add-as" role="radiogroup">
			{#each artworkKinds as { kind, label } (kind)}
				<label class="kind" class:chosen={artworkKind === kind}>
					<input name="artwork-kind" type="radio" value={kind} bind:group={artworkKind} />
					{label}
				</label>
			{/each}
		</div>
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
						onclick={() => onadd({ kind: artworkKind, artworkId: artwork.id })}
						onpointerdown={(event) => ondrag?.(event, { kind: artworkKind, artworkId: artwork.id })}
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
		<a class="browse" href={resolve('/(app)/atelier')} rel="external noopener" target="_blank">
			{m.exhibitions.panel.browse}
		</a>
		{#if addHref}
			<a class="browse" href={addHref}>{m.exhibitions.panel.addMissing}</a>
		{/if}
	</section>
</FilterSidePanel>

<style>
	.section {
		display: grid;
		gap: var(--spacing-3);
	}

	h3 {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}

	.kinds {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}

	.kind {
		padding: var(--spacing-2) var(--spacing-3);
		border: var(--border-width-hairline) solid var(--color-line);
		border-radius: var(--border-radius-none);
		background: transparent;
		color: inherit;
		font: inherit;
		cursor: grab;
	}

	.as {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}

	.as .kind {
		cursor: pointer;
	}

	.as input {
		position: absolute;
		opacity: 0;
	}

	.as .chosen {
		background: var(--color-fg);
		color: var(--color-on-fg);
	}

	.as .kind:focus-within {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: var(--spacing-1);
	}

	.tiles {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
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

	.browse {
		color: inherit;
	}
</style>
