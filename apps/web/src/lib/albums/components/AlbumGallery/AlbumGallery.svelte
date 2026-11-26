<script lang="ts">
	import { Alert, Button, FormActions, PageHeader, TextButton } from '@study-atelier/ui';
	import { MediaQuery } from 'svelte/reactivity';
	import { innerWidth } from 'svelte/reactivity/window';
	import { SvelteSet } from 'svelte/reactivity';
	import { m } from '#lib/i18n/i18n.ts';
	import ListTools from '#lib/shared/lists/ListTools/ListTools.svelte';
	import AlbumArtworkTile from '#lib/albums/components/AlbumArtworkTile/AlbumArtworkTile.svelte';
	import { artworkState } from '#lib/albums/album-matching/album-matching.ts';
	import {
		albumCounts,
		artworkDate,
		authorNames
	} from '#lib/albums/album-summary/album-summary.ts';
	import { columnCount, distribute, WIDE_MIN_WIDTH } from '#lib/wall/masonry/masonry.ts';
	import { normalizeForSearch } from '#lib/shared/utils/search/search.ts';
	import type { Album } from '#lib/albums/types/album.ts';
	import type { AlbumArtwork } from '#lib/albums/types/album-artwork.ts';
	import type { AtelierMatch } from '#lib/albums/types/atelier-match.ts';

	type Props = {
		album: Album;
		matches: AtelierMatch[];
		error?: string;
		onadd?: (entryIds: string[]) => void;
	};

	let { album, matches, error, onadd }: Props = $props();

	const PHONE_COLUMNS = 2;

	const wide = new MediaQuery(`min-width: ${WIDE_MIN_WIDTH}px`);

	let tiles = $derived(
		album.artworks.map((artwork) => {
			const authors = authorNames(album, artwork);
			return {
				artwork,
				authors,
				date: artworkDate(artwork),
				state: artworkState(album.slug, artwork, matches),
				words: normalizeForSearch(
					[artwork.title, ...artwork.alternativeTitles, ...authors].join(' ')
				)
			};
		})
	);

	const selected = new SvelteSet<string>();

	$effect.pre(() => {
		selected.clear();
		for (const tile of tiles) if (tile.state.kind !== 'owned') selected.add(tile.artwork.id);
	});

	let query = $state('');
	let term = $derived(normalizeForSearch(query));
	let shown = $derived(term ? tiles.filter((tile) => tile.words.includes(term)) : tiles);
	let selectable = $derived(shown.filter((tile) => tile.state.kind !== 'owned'));
	let allSelected = $derived(selectable.every((tile) => selected.has(tile.artwork.id)));
	let count = $derived(wide.current ? columnCount(true, innerWidth.current ?? 0) : PHONE_COLUMNS);
	let columns = $derived(distribute(shown, count, (tile) => ratioOf(tile.artwork)));
	let counts = $derived(albumCounts(album));
	let chosen = $derived(album.artworks.filter((artwork) => selected.has(artwork.id)));

	function ratioOf(artwork: AlbumArtwork): number {
		const image = artwork.images[0];
		return image.height / image.width;
	}

	function toggle(id: string): void {
		if (selected.has(id)) selected.delete(id);
		else selected.add(id);
	}

	function toggleAll(): void {
		const select = !allSelected;
		for (const tile of selectable) {
			if (select) selected.add(tile.artwork.id);
			else selected.delete(tile.artwork.id);
		}
	}
</script>

<div class="gallery">
	<PageHeader lead={album.description}>
		{#snippet aside()}
			<span class="caption">{m.albums.counts(counts.artworks, counts.terms, counts.events)}</span>
		{/snippet}
	</PageHeader>

	{#if error}
		<Alert title={m.albums.albumLoadErrorTitle} tone="danger">
			{error}
		</Alert>
	{/if}

	<ListTools narrow searchLabel={m.albums.search} bind:query>
		{#snippet actions()}
			{#if selectable.length > 0}
				<TextButton onclick={toggleAll}>
					{allSelected ? m.albums.deselectAll : m.albums.selectAll}
				</TextButton>
			{/if}
		{/snippet}
	</ListTools>

	{#if shown.length === 0}
		<p class="lead">{m.albums.noResults(query.trim())}</p>
	{:else}
		<div class="wall" class:compact={!wide.current}>
			{#each columns as column, index (index)}
				<ul class="column">
					{#each column as tile (tile.artwork.id)}
						<li>
							<AlbumArtworkTile
								artwork={tile.artwork}
								authors={tile.authors}
								checked={selected.has(tile.artwork.id)}
								compact={!wide.current}
								date={tile.date}
								ontoggle={() => toggle(tile.artwork.id)}
								slug={album.slug}
								state={tile.state}
							/>
						</li>
					{/each}
				</ul>
			{/each}
		</div>
	{/if}

	<FormActions>
		<span class="caption count">{m.albums.selected(chosen.length, counts.artworks)}</span>
		<Button
			disabled={!onadd || chosen.length === 0}
			onclick={() => onadd?.(chosen.map((artwork) => artwork.id))}
			variant="primary"
		>
			{m.albums.add(chosen.length)}
		</Button>
	</FormActions>
</div>

<style>
	.gallery {
		display: grid;
		gap: var(--spacing-6);
		width: 100%;
		max-width: var(--size-content-wide);
		margin-inline: auto;
	}

	.wall {
		display: flex;
		align-items: flex-start;
		gap: var(--spacing-6);
	}

	.column {
		display: grid;
		flex: 1;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--spacing-6);
		min-width: 0;
		list-style: none;
	}

	.compact,
	.compact .column {
		gap: var(--spacing-3);
	}

	.count {
		align-self: center;
	}
</style>
