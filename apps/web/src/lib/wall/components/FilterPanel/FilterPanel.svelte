<script lang="ts">
	import { untrack } from 'svelte';
	import {
		Checkbox,
		type ChoiceTile,
		SearchField,
		TextField,
		ToggleTiles
	} from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import { artworkTypeTiles } from '#lib/catalogue/artwork-types/artwork-types.ts';
	import { eraTiles } from '#lib/catalogue/eras/eras.ts';
	import {
		UNKNOWN_AUTHOR,
		favouriteCount,
		filterOptions,
		hasOwnText,
		optionLabel,
		ownFilterOptions,
		setOwnText,
		setYears,
		tickedOptions,
		toggleFavourites,
		toggleOwnValue,
		toggleTicked,
		toggleValue
	} from '#lib/wall/filter/filter.ts';
	import type { OwnFieldDefinition } from '#lib/collection/types.ts';
	import type { ArtworkTypeCode } from '#lib/catalogue/types/artwork-type-code.ts';
	import type { CollectionFilter } from '#lib/catalogue/types/collection-filter.ts';
	import type { EraCode } from '#lib/catalogue/types/era-code.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import FavouriteToggle from '#lib/wall/components/FavouriteToggle/FavouriteToggle.svelte';
	import FilterValues from '#lib/wall/components/FilterValues/FilterValues.svelte';

	type Props = {
		artworks: WallArtwork[];
		filter: CollectionFilter;
		ownFields?: OwnFieldDefinition[];
	};

	const FREQUENT_LIMIT = 8;

	let { artworks, filter = $bindable(), ownFields = [] }: Props = $props();

	let fieldNames = $derived(new Map(ownFields.map((field) => [field.id, field.name])));

	let eraTilesWithCounts = $derived(withCounts(eraTiles(), 'eras'));
	let typeTilesWithCounts = $derived(withCounts(artworkTypeTiles(), 'types'));

	let fromText = $state('');
	let toText = $state('');
	let fromBefore = $state(false);
	let toBefore = $state(false);

	function withCounts(
		tiles: ChoiceTile[],
		field: 'eras' | 'types'
	): (ChoiceTile & { count: number })[] {
		const counts = new Map(
			filterOptions(artworks, filter, field).map((option) => [option.value, option.count])
		);
		return tiles.map((tile) => ({ ...tile, count: counts.get(tile.value) ?? 0 }));
	}

	function parseYear(text: string, before: boolean): number | null {
		const digits = text.trim();
		if (!/^\d+$/.test(digits)) return null;
		const year = Number(digits);
		if (!Number.isSafeInteger(year)) return null;
		return before ? -year : year;
	}

	function digitsOf(year: number | null): string {
		return year === null ? '' : String(Math.abs(year));
	}

	$effect(() => {
		const { yearFrom, yearTo } = filter;
		untrack(() => {
			if (parseYear(fromText, fromBefore) !== yearFrom) {
				fromText = digitsOf(yearFrom);
				fromBefore = yearFrom !== null && yearFrom < 0;
			}
			if (parseYear(toText, toBefore) !== yearTo) {
				toText = digitsOf(yearTo);
				toBefore = yearTo !== null && yearTo < 0;
			}
		});
	});

	$effect(() => {
		const yearFrom = parseYear(fromText, fromBefore);
		const yearTo = parseYear(toText, toBefore);
		untrack(() => {
			if (yearFrom !== filter.yearFrom || yearTo !== filter.yearTo)
				filter = setYears(filter, yearFrom, yearTo);
		});
	});

	function choose(
		field: 'authors' | 'periods' | 'styles' | 'materials' | 'locations' | 'missing',
		value: string
	): void {
		filter = toggleValue(filter, field, value);
	}
</script>

<div class="panel">
	<FavouriteToggle
		count={favouriteCount(artworks, filter)}
		onclick={() => (filter = toggleFavourites(filter))}
		pressed={filter.favourites}
	/>

	<ToggleTiles
		label={m.atelier.filters.fields.eras}
		onchange={(values) => (filter = { ...filter, eras: values as EraCode[] })}
		options={eraTilesWithCounts}
		values={filter.eras}
	/>

	<ToggleTiles
		columns={2}
		label={m.atelier.filters.fields.types}
		onchange={(values) => (filter = { ...filter, types: values as ArtworkTypeCode[] })}
		options={typeTilesWithCounts}
		values={filter.types}
	/>

	<section class="years">
		<h3>{m.atelier.filters.fields.years}</h3>
		<div class="range">
			<div class="year">
				<TextField inputmode="numeric" label={m.atelier.filters.yearFrom} bind:value={fromText} />
				<Checkbox label={m.atelier.filters.beforeCommonEra} bind:checked={fromBefore} />
			</div>
			<div class="year">
				<TextField inputmode="numeric" label={m.atelier.filters.yearTo} bind:value={toText} />
				<Checkbox label={m.atelier.filters.beforeCommonEra} bind:checked={toBefore} />
			</div>
		</div>
	</section>

	<FilterValues
		name={(value) => optionLabel('authors', value)}
		chosen={filter.unknownAuthor ? [...filter.authors, UNKNOWN_AUTHOR] : filter.authors}
		limit={FREQUENT_LIMIT}
		onchoose={(value) => choose('authors', value)}
		options={filterOptions(artworks, filter, 'authors')}
		searchLabel={m.atelier.filters.searchValues(m.atelier.filters.fields.authors)}
		title={m.atelier.filters.fields.authors}
	/>

	<FilterValues
		name={(value) => value}
		chosen={filter.periods}
		limit={FREQUENT_LIMIT}
		onchoose={(value) => choose('periods', value)}
		options={filterOptions(artworks, filter, 'periods')}
		searchLabel={m.atelier.filters.searchValues(m.atelier.filters.fields.periods)}
		title={m.atelier.filters.fields.periods}
	/>

	<FilterValues
		name={(value) => value}
		chosen={filter.styles}
		limit={FREQUENT_LIMIT}
		onchoose={(value) => choose('styles', value)}
		options={filterOptions(artworks, filter, 'styles')}
		searchLabel={m.atelier.filters.searchValues(m.atelier.filters.fields.styles)}
		title={m.atelier.filters.fields.styles}
	/>

	<FilterValues
		name={(value) => value}
		chosen={filter.materials}
		limit={FREQUENT_LIMIT}
		onchoose={(value) => choose('materials', value)}
		options={filterOptions(artworks, filter, 'materials')}
		searchLabel={m.atelier.filters.searchValues(m.atelier.filters.fields.materials)}
		title={m.atelier.filters.fields.materials}
	/>

	<FilterValues
		name={(value) => value}
		chosen={filter.locations}
		limit={FREQUENT_LIMIT}
		onchoose={(value) => choose('locations', value)}
		options={filterOptions(artworks, filter, 'locations')}
		searchLabel={m.atelier.filters.searchValues(m.atelier.filters.fields.locations)}
		title={m.atelier.filters.fields.locations}
	/>

	{#each ownFields as field (field.id)}
		{#if field.kind === 'list'}
			<FilterValues
				name={(value) => value}
				chosen={filter.own[field.id] ?? []}
				limit={FREQUENT_LIMIT}
				onchoose={(value) => (filter = toggleOwnValue(filter, field.id, value))}
				options={ownFilterOptions(artworks, filter, field.id)}
				searchLabel={m.atelier.filters.searchValues(field.name)}
				title={field.name}
			/>
		{:else if field.kind === 'text' && hasOwnText(artworks, field.id)}
			<section class="text">
				<h3>{field.name}</h3>
				<SearchField
					compact
					label={m.ownFields.search(field.name)}
					placeholder={m.ownFields.search(field.name)}
					bind:value={
						() => filter.ownTexts[field.id] ?? '',
						(text) => (filter = setOwnText(filter, field.id, text))
					}
				/>
			</section>
		{/if}
	{/each}

	<FilterValues
		name={(id) => fieldNames.get(id) ?? ''}
		chosen={filter.ticked}
		onchoose={(id) => (filter = toggleTicked(filter, id))}
		options={tickedOptions(artworks, filter, ownFields)}
		title={m.atelier.filters.fields.ticked}
	/>

	<FilterValues
		name={(value) => optionLabel('missing', value)}
		chosen={filter.missing}
		onchoose={(value) => choose('missing', value)}
		options={filterOptions(artworks, filter, 'missing')}
		title={m.atelier.filters.fields.missing}
	/>
</div>

<style>
	.panel {
		display: grid;
		gap: var(--spacing-8);
	}

	.years,
	.text {
		display: grid;
		gap: var(--spacing-3);
	}

	h3 {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		line-height: var(--line-height-sm);
	}

	.range {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-3);
	}

	.year {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--spacing-2);
	}
</style>
