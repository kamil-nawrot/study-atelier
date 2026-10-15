<script lang="ts">
	import { untrack } from 'svelte';
	import { Checkbox, TextField, ToggleTiles } from '@study-atelier/ui';
	import { m } from '#lib/i18n/index.ts';
	import { eraTiles } from '../eras.ts';
	import { UNKNOWN_AUTHOR, filterOptions, optionLabel, setYears, toggleValue } from '../filter.ts';
	import type { CollectionFilter, EraCode, WallArtwork } from '../types.ts';
	import FilterValues from './FilterValues.svelte';

	type Props = {
		artworks: WallArtwork[];
		filter: CollectionFilter;
	};

	const FREQUENT_LIMIT = 8;

	let { artworks, filter = $bindable() }: Props = $props();

	let eras = $derived(filterOptions(artworks, filter, 'eras'));
	let eraCounts = $derived(new Map(eras.map((option) => [option.value, option.count])));
	let tiles = $derived(
		eraTiles().map((tile) => ({ ...tile, count: eraCounts.get(tile.value) ?? 0 }))
	);

	let fromText = $state('');
	let toText = $state('');
	let fromBefore = $state(false);
	let toBefore = $state(false);

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
		field: 'types' | 'authors' | 'periods' | 'styles' | 'materials' | 'locations' | 'missing',
		value: string
	): void {
		filter = toggleValue(filter, field, value);
	}
</script>

<div class="panel">
	<ToggleTiles
		label={m.atelier.filters.fields.eras}
		onchange={(values) => (filter = { ...filter, eras: values as EraCode[] })}
		options={tiles}
		values={filter.eras}
	/>

	<FilterValues
		name={(value) => optionLabel('types', value)}
		chosen={filter.types}
		onchoose={(value) => choose('types', value)}
		options={filterOptions(artworks, filter, 'types')}
		searchLabel={m.atelier.filters.searchValues(m.atelier.filters.fields.types)}
		title={m.atelier.filters.fields.types}
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
		onchoose={(value) => choose('periods', value)}
		options={filterOptions(artworks, filter, 'periods')}
		searchLabel={m.atelier.filters.searchValues(m.atelier.filters.fields.periods)}
		title={m.atelier.filters.fields.periods}
	/>

	<FilterValues
		name={(value) => value}
		chosen={filter.styles}
		onchoose={(value) => choose('styles', value)}
		options={filterOptions(artworks, filter, 'styles')}
		searchLabel={m.atelier.filters.searchValues(m.atelier.filters.fields.styles)}
		title={m.atelier.filters.fields.styles}
	/>

	<FilterValues
		name={(value) => value}
		chosen={filter.materials}
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
