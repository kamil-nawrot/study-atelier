<script lang="ts">
	import { SearchField } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import ExhibitionPoster from '#lib/exhibitions/components/ExhibitionPoster/ExhibitionPoster.svelte';
	import {
		EXHIBITION_SEARCH_MIN_COUNT,
		matchingExhibitions
	} from '#lib/exhibitions/exhibition-search/exhibition-search.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import type { ExhibitionSummary } from '#lib/exhibitions/types/exhibition-summary.ts';

	type Props = {
		exhibitions: readonly ExhibitionSummary[];
		covers: ReadonlyMap<string, WallArtwork>;
		query?: string;
		onimagefailed?: (artwork: WallArtwork) => void;
	};

	let { exhibitions, covers, query = $bindable(''), onimagefailed }: Props = $props();

	let searchable = $derived(exhibitions.length >= EXHIBITION_SEARCH_MIN_COUNT);
	let shown = $derived(searchable ? matchingExhibitions(exhibitions, query) : exhibitions);
</script>

<div class="exhibitions">
	{#if searchable}
		<div class="search">
			<SearchField
				compact
				label={m.exhibitions.search}
				placeholder={m.exhibitions.search}
				bind:value={query}
			/>
		</div>
	{/if}

	{#if shown.length === 0}
		<p class="lead">{m.exhibitions.noResults(query.trim())}</p>
	{:else}
		<ul>
			{#each shown as exhibition (exhibition.id)}
				<li>
					<ExhibitionPoster
						cover={exhibition.coverId ? covers.get(exhibition.coverId) : undefined}
						{exhibition}
						{onimagefailed}
					/>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.exhibitions {
		display: grid;
		gap: var(--spacing-6);
	}

	.search {
		max-width: var(--size-content-default);
	}

	ul {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--spacing-8) var(--spacing-6);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	@media (min-width: 768px) {
		ul {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style>
