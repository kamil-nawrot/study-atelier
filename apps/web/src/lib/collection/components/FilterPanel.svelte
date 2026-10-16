<script lang="ts">
	import { untrack } from 'svelte';
	import Heart from '@lucide/svelte/icons/heart';
	import {
		Checkbox,
		type ChoiceTile,
		Icon,
		TextField,
		ToggleTag,
		ToggleTiles
	} from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import { artworkTypeTiles } from '../artwork-types.ts';
	import { eraTiles } from '../eras.ts';
	import {
		UNKNOWN_AUTHOR,
		favouriteCount,
		filterOptions,
		optionLabel,
		setYears,
		toggleFavourites,
		toggleValue
	} from '../filter.ts';
	import type { ArtworkTypeCode, CollectionFilter, EraCode, WallArtwork } from '../types.ts';
	import FilterValues from './FilterValues.svelte';

	type Props = {
		artworks: WallArtwork[];
		filter: CollectionFilter;
	};

	const FREQUENT_LIMIT = 8;

	let { artworks, filter = $bindable() }: Props = $props();

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
	<div class="favourites">
		<ToggleTag
			count={favouriteCount(artworks, filter)}
			onclick={() => (filter = toggleFavourites(filter))}
			pressed={filter.favourites}
		>
			<Icon icon={Heart} size="sm" />
			{m.atelier.filters.fields.favourites}
		</ToggleTag>
	</div>

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

	.favourites :global(.label) {
		display: inline-flex;
		align-items: center;
		gap: var(--spacing-2);
	}

	.favourites :global(svg) {
		width: var(--font-size-md);
		height: var(--font-size-md);
	}

	.favourites :global([aria-pressed='true'] svg) {
		fill: currentColor;
	}

	.years {
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
