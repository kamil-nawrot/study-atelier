<script lang="ts">
	import { ToggleTag } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import BarList from '#lib/statistics/components/BarList/BarList.svelte';
	import CrossTable from '#lib/statistics/components/CrossTable/CrossTable.svelte';
	import { wallHref, type Dimension } from '#lib/statistics/dimensions/dimensions.ts';
	import {
		BAR_ROWS,
		TABLE_COLUMNS,
		barsOf,
		crossTableOf
	} from '#lib/statistics/distribution/distribution.ts';
	import type { WallArtwork } from '#lib/catalogue/types/wall-artwork.ts';
	import type { BarRow } from '#lib/statistics/types/bar-row.ts';

	type Props = {
		artworks: WallArtwork[];
		dimensions: Dimension[];
	};

	let { artworks, dimensions }: Props = $props();

	const SHOWN_FROM = 20;
	const texts = m.statistics.composition;

	let first = $state('eras');
	let second = $state<string>();

	let rowDimension = $derived(
		dimensions.find((dimension) => dimension.key === first) ?? dimensions[0]
	);
	let columnDimension = $derived(dimensions.find((dimension) => dimension.key === second));

	let bars = $derived(columnDimension ? undefined : barsOf(artworks, rowDimension));
	let table = $derived(columnDimension && crossTableOf(artworks, rowDimension, columnDimension));

	let barRows = $derived.by((): BarRow[] => {
		if (!bars) return [];
		const rows: BarRow[] = bars.rows.map((row) => ({
			key: row.value,
			name: rowDimension.nameOf(row.value),
			count: row.count,
			href: wallHref(rowDimension.filterOf(row.value))
		}));
		if (bars.rest)
			rows.push({
				key: '\u0000rest',
				name: texts.rest(bars.rest.values),
				count: bars.rest.count,
				muted: true
			});
		if (bars.unknown > 0)
			rows.push({
				key: '\u0000unknown',
				name: rowDimension.nameOf(''),
				count: bars.unknown,
				href: wallHref(rowDimension.filterOf('')),
				muted: true
			});
		if (bars.none > 0)
			rows.push({
				key: '\u0000none',
				name: rowDimension.none,
				count: bars.none,
				href: rowDimension.noneFilter && wallHref(rowDimension.noneFilter),
				muted: true
			});
		return rows;
	});

	let clipped = $derived.by(() => {
		if (!table || !columnDimension) return undefined;
		const parts: string[] = [];
		if (table.allRows > BAR_ROWS)
			parts.push(texts.clippedPart(BAR_ROWS, valuesName(rowDimension), table.allRows));
		if (table.allColumns > TABLE_COLUMNS)
			parts.push(texts.clippedPart(TABLE_COLUMNS, valuesName(columnDimension), table.allColumns));
		return parts.length > 0 ? texts.clipped(parts) : undefined;
	});

	function valuesName(dimension: Dimension): string {
		return texts.values[dimension.key] ?? texts.ownValues(dimension.label);
	}

	function chooseFirst(key: string): void {
		first = key;
		if (second === key) second = undefined;
	}
</script>

<section aria-labelledby="statistics-composition">
	<h2 id="statistics-composition">{texts.title}</h2>
	{#if artworks.length < SHOWN_FROM}
		<p class="caption">{texts.tooEarly(artworks.length)}</p>
	{:else}
		<div class="choices">
			<div class="choice" aria-labelledby="statistics-group-by" role="group">
				<span id="statistics-group-by" class="caption">{texts.groupBy}</span>
				<div class="tags">
					{#each dimensions as dimension (dimension.key)}
						<ToggleTag
							bind:pressed={() => first === dimension.key, () => chooseFirst(dimension.key)}
						>
							{dimension.label}
						</ToggleTag>
					{/each}
				</div>
			</div>
			<div class="choice" aria-labelledby="statistics-second-by" role="group">
				<span id="statistics-second-by" class="caption">{texts.secondBy}</span>
				<div class="tags">
					<ToggleTag bind:pressed={() => second === undefined, () => (second = undefined)}>
						{texts.noSecond}
					</ToggleTag>
					{#each dimensions.filter((dimension) => dimension.key !== first) as dimension (dimension.key)}
						<ToggleTag
							bind:pressed={() => second === dimension.key, () => (second = dimension.key)}
						>
							{dimension.label}
						</ToggleTag>
					{/each}
				</div>
			</div>
		</div>
		{#if table && columnDimension}
			<CrossTable columns={columnDimension} rows={rowDimension} {table} />
			{#if clipped}
				<p class="caption">{clipped}</p>
			{/if}
		{:else}
			<BarList rows={barRows} />
		{/if}
	{/if}
</section>

<style>
	section {
		display: grid;
		gap: var(--spacing-4);
	}

	h2 {
		padding-block-end: var(--spacing-2);
		border-block-end: var(--border-width-hairline) solid var(--color-tag);
	}

	.choices {
		display: grid;
		gap: var(--spacing-4);
	}

	.choice {
		display: grid;
		align-content: start;
		gap: var(--spacing-2);
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}

	@media (min-width: 768px) {
		.choices {
			grid-template-columns: 1fr 1fr;
			gap: var(--spacing-6);
		}
	}
</style>
