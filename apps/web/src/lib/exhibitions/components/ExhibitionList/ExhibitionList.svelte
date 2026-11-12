<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import ExhibitionPoster from '#lib/exhibitions/components/ExhibitionPoster/ExhibitionPoster.svelte';
	import { matchingExhibitions } from '#lib/exhibitions/exhibition-search/exhibition-search.ts';
	import {
		EXHIBITION_SORTS,
		rememberedExhibitionSort,
		rememberExhibitionSort,
		sortExhibitions,
		type ExhibitionSort
	} from '#lib/exhibitions/exhibition-sort/exhibition-sort.ts';
	import ListTools from '#lib/shared/lists/ListTools/ListTools.svelte';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import type { ExhibitionSummary } from '#lib/exhibitions/types/exhibition-summary.ts';

	type Props = {
		exhibitions: readonly ExhibitionSummary[];
		covers: ReadonlyMap<string, WallArtwork>;
		query?: string;
		onimagefailed?: (artwork: WallArtwork) => void;
	};

	let { exhibitions, covers, query = $bindable(''), onimagefailed }: Props = $props();

	let sort = $state<ExhibitionSort>(rememberedExhibitionSort());

	const options = EXHIBITION_SORTS.map((value) => ({ value, label: m.exhibitions.sorts[value] }));

	let shown = $derived(sortExhibitions(matchingExhibitions(exhibitions, query), sort));

	function choose(value: string): void {
		sort = EXHIBITION_SORTS.find((known) => known === value) ?? 'changed';
		rememberExhibitionSort(sort);
	}
</script>

<div class="exhibitions">
	<div class="filter">
		<ListTools
			narrow
			{options}
			searchLabel={m.exhibitions.search}
			sortLabel={m.exhibitions.sortLabel}
			bind:query
			bind:sort={() => sort, choose}
		/>
	</div>

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

	.filter {
		padding-bottom: var(--spacing-6);
		border-bottom: var(--border-width-hairline) solid var(--color-line);
	}

	ul {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--spacing-8) var(--spacing-6);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	@media (max-width: 767.98px) {
		.filter {
			padding-bottom: var(--spacing-4);
		}
	}

	@media (min-width: 768px) {
		ul {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
</style>
