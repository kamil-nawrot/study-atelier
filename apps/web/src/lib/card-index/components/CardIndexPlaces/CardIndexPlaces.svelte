<script lang="ts">
	import MapPin from '@lucide/svelte/icons/map-pin';
	import { EmptyState } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import type { Snippet } from 'svelte';
	import CardIndexCountry from '#lib/card-index/components/CardIndexCountry/CardIndexCountry.svelte';
	import CardIndexPlaceGroups from '#lib/card-index/components/CardIndexPlaceGroups/CardIndexPlaceGroups.svelte';
	import CardIndexTools from '#lib/card-index/components/CardIndexTools/CardIndexTools.svelte';
	import {
		PLACE_FOLDING_KEYS,
		citiesWithMatchingPlaces,
		cityIds,
		narrowPlaceTree
	} from '#lib/card-index/place-tree/place-tree.ts';
	import { TimelineFolding } from '#lib/card-index/timeline-folding/timeline-folding.svelte.ts';
	import { sortsOf, type CardIndexSort } from '#lib/card-index/card-index-sort/card-index-sort.ts';
	import type { CardIndexPlaces } from '#lib/card-index/types/card-index-places.ts';

	type Props = {
		places: CardIndexPlaces;
		query?: string;
		sort?: CardIndexSort;
		actions?: Snippet;
	};

	let { places: full, query = $bindable(''), sort = $bindable('name'), actions }: Props = $props();

	let places = $derived(narrowPlaceTree(full, query, sort));
	let matched = $derived(citiesWithMatchingPlaces(places, query));
	let cities = $derived(cityIds(full));
	let isEmpty = $derived(full.countries.length === 0 && full.withoutCountry.length === 0);
	let hasCountries = $derived(places.countries.length > 0);

	const folding = new TimelineFolding(
		() => ({ query, matched, periods: cities }),
		PLACE_FOLDING_KEYS
	);
</script>

{#if isEmpty}
	{#if actions}
		<div class="solo">{@render actions()}</div>
	{/if}
	<EmptyState icon={MapPin} text={m.cardIndex.emptyList.location} />
{:else}
	<div class="places">
		<CardIndexTools
			{actions}
			searchLabel={m.cardIndex.search.location}
			sorts={sortsOf('location')}
			bind:query
			bind:sort
		/>
		{#if !hasCountries && places.withoutCountry.length === 0}
			<p class="lead">{m.cardIndex.noResults(query.trim())}</p>
		{/if}
		{#if hasCountries}
			<ol class="countries">
				{#each places.countries as country (country.code)}
					<CardIndexCountry {country} {folding} />
				{/each}
			</ol>
		{/if}
		{#if places.withoutCountry.length > 0}
			<section class={['group', { divided: hasCountries }]}>
				<h2 class="group-title">{m.cardIndex.placesWithoutCountry}</h2>
				<CardIndexPlaceGroups {folding} groups={places.withoutCountry} />
			</section>
		{/if}
	</div>
{/if}

<style>
	.solo {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: var(--spacing-3);
	}

	.places {
		display: grid;
		gap: var(--spacing-6);
	}

	.countries {
		display: grid;
		gap: var(--spacing-6);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.group {
		display: grid;
		gap: var(--spacing-2);
	}

	.group.divided {
		padding-top: var(--spacing-8);
		border-top: var(--border-width-hairline) solid var(--color-line);
	}

	.group-title {
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		font-variant-caps: all-small-caps;
		letter-spacing: var(--letter-spacing-wide);
		line-height: var(--line-height-sm);
	}
</style>
