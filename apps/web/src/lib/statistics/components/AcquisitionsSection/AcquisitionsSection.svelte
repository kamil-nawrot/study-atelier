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
	<h2 id="statistics-acquisitions" class="artwork-title">{texts.title}</h2>
	<p class="caption">{texts.caption(growth.unit, longDate(growth.firstDay, true, true))}</p>
	<ColumnChart {columns} {describe} label={texts.chart} />
</section>

<style>
	section {
		display: grid;
		gap: var(--spacing-4);
		padding-block-start: var(--spacing-6);
		border-block-start: var(--border-width-hairline) solid var(--color-line);
	}

	h2 {
		font-size: var(--font-size-2xl);
		line-height: var(--line-height-2xl);
	}
</style>
