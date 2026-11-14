<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import type { Holdings } from '#lib/statistics/holdings/holdings.ts';
	import type { CollectionStatistics } from '#lib/statistics/types/collection-statistics.ts';

	type Props = {
		holdings: Holdings;
		statistics: CollectionStatistics;
	};

	let { holdings, statistics }: Props = $props();

	const texts = m.statistics.holdings;

	let items = $derived([
		{ count: holdings.artworks, label: texts.artworks },
		{ count: holdings.authors, label: texts.authors },
		{ count: holdings.places, label: texts.places },
		{ count: holdings.seen, label: texts.seen },
		{ count: statistics.terms, label: texts.terms },
		{ count: statistics.events, label: texts.events },
		{ count: statistics.visits, label: texts.visits },
		{ count: statistics.trips, label: texts.trips },
		{ count: statistics.exhibitions, label: texts.exhibitions }
	]);
</script>

<section aria-labelledby="statistics-holdings">
	<h2 id="statistics-holdings" class="artwork-title">{texts.title}</h2>
	<dl>
		{#each items as item (item.label)}
			<div>
				<dt>{item.label(item.count)}</dt>
				<dd>{item.count}</dd>
			</div>
		{/each}
	</dl>
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

	dl {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--spacing-6) var(--spacing-3);
	}

	div {
		display: flex;
		flex-direction: column-reverse;
		justify-content: flex-end;
		gap: var(--spacing-1);
	}

	dt {
		font-size: var(--font-size-xs);
		color: var(--color-fg-muted);
	}

	dd {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-bold);
		font-variant-numeric: tabular-nums;
		line-height: var(--line-height-xl);
	}

	@media (min-width: 768px) {
		dt {
			font-size: var(--font-size-sm);
		}

		dd {
			font-size: var(--font-size-xl);
		}
	}
</style>
