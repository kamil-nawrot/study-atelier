<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import { PlaceSearch } from '#lib/map/place-search/place-search.svelte.ts';
	import type { PlaceChoice } from '#lib/map/types/place-choice.ts';
	import type { WikidataPlace } from '#lib/images/types/wikidata-place.ts';

	type Props = {
		name: string;
		choice: PlaceChoice | null;
		onchoose: (choice: PlaceChoice) => void;
	};

	let { name, choice, onchoose }: Props = $props();

	const search = new PlaceSearch();

	$effect(() => {
		void search.search(name);
	});

	function choose(place: WikidataPlace): void {
		onchoose({
			point: { latitude: place.latitude, longitude: place.longitude },
			wikidataId: place.wikidataId
		});
	}
</script>

<section class="suggestions" aria-busy={search.status === 'searching'}>
	{#if search.status === 'searching'}
		<p class="status">{m.map.suggestions.searching}</p>
	{:else if search.status === 'none'}
		<p class="status">{m.map.suggestions.none}</p>
	{:else if search.status === 'failed'}
		<p class="status">{m.map.suggestions.failed}</p>
	{:else}
		<h3>{m.map.suggestions.title}</h3>
		<ul>
			{#each search.places as place (place.wikidataId)}
				<li>
					<button
						class:chosen={choice?.wikidataId === place.wikidataId}
						aria-pressed={choice?.wikidataId === place.wikidataId}
						onclick={() => choose(place)}
						type="button"
					>
						<span class="label">{place.label}</span>
						{#if place.description}
							<span class="description">{place.description}</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.suggestions {
		display: grid;
		gap: var(--spacing-2);
	}

	h3,
	.status {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-regular);
		line-height: var(--line-height-sm);
	}

	ul {
		display: grid;
		gap: var(--spacing-1);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	button {
		display: grid;
		gap: var(--spacing-1);
		width: 100%;
		padding: var(--spacing-2) var(--spacing-3);
		border: var(--border-width-base) solid transparent;
		background: var(--color-tag);
		color: var(--color-fg);
		font: inherit;
		text-align: start;
		cursor: pointer;
	}

	button:hover {
		background: var(--color-surface);
	}

	button.chosen {
		border-color: var(--color-fg);
	}

	.description {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}
</style>
