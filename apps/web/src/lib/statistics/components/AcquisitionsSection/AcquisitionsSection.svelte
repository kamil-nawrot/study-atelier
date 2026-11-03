<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import ColumnChart from '#lib/statistics/components/ColumnChart/ColumnChart.svelte';
	import { columnsOf, type Column } from '#lib/statistics/acquisitions/acquisitions.ts';
	import type { CollectionStatistics } from '#lib/statistics/types/collection-statistics.ts';

	type Props = {
		growth: NonNullable<CollectionStatistics['growth']>;
	};

	let { growth }: Props = $props();

	const texts = m.statistics.acquisitions;

	function longDate(start: string, withYear: boolean, withDay = growth.unit !== 'month'): string {
		return new Intl.DateTimeFormat('pl', {
			day: withDay ? 'numeric' : undefined,
			month: 'long',
			year: withYear ? 'numeric' : undefined,
			timeZone: 'UTC'
		}).format(new Date(`${start}T00:00:00Z`));
	}

	function describe(column: Column): string {
		const when = longDate(column.start, growth.unit === 'month');
		return texts.column(growth.unit === 'week' ? texts.weekFrom(when) : when, column.added);
	}

	let columns = $derived(columnsOf(growth.unit, growth.buckets));
</script>

<section aria-labelledby="statistics-acquisitions">
	<h2 id="statistics-acquisitions">{texts.title}</h2>
	<p class="caption">{texts.caption(growth.unit, longDate(growth.firstDay, true, true))}</p>
	<ColumnChart {columns} {describe} label={texts.chart} />
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
</style>
