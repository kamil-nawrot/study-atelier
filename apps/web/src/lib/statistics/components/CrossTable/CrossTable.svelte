<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import { cellKey, type CrossTable } from '#lib/statistics/distribution/distribution.ts';
	import { wallHref, type Dimension } from '#lib/statistics/dimensions/dimensions.ts';

	type Props = {
		table: CrossTable;
		rows: Dimension;
		columns: Dimension;
	};

	let { table, rows, columns }: Props = $props();

	const texts = m.statistics.composition;

	let max = $derived(
		Math.max(
			1,
			...table.rows.flatMap((row) =>
				table.columns.map((column) => table.cells.get(cellKey(row.value, column.value)) ?? 0)
			)
		)
	);

	function shade(count: number): number {
		return Math.round(8 + (62 * count) / max);
	}
</script>

<div class="scroll">
	<table>
		<thead>
			<tr>
				<td></td>
				{#each table.columns as column (column.value)}
					<th scope="col">{columns.nameOf(column.value)}</th>
				{/each}
				<th class="total" scope="col">{texts.total}</th>
			</tr>
		</thead>
		<tbody>
			{#each table.rows as row (row.value)}
				<tr>
					<th scope="row">{rows.nameOf(row.value)}</th>
					{#each table.columns as column (column.value)}
						{@const count = table.cells.get(cellKey(row.value, column.value)) ?? 0}
						{#if count === 0}
							<td class="zero">{texts.zero}</td>
						{:else}
							{@const href = wallHref(rows.filterOf(row.value), columns.filterOf(column.value))}
							<td style:--shade="{shade(count)}%" class:strong={shade(count) > 45}>
								<a
									aria-label="{rows.nameOf(row.value)}, {columns.nameOf(column.value)}: {count}"
									{href}>{count}</a
								>
							</td>
						{/if}
					{/each}
					<td class="total">{row.count}</td>
				</tr>
			{/each}
		</tbody>
		<tfoot>
			<tr>
				<th scope="row">{texts.total}</th>
				{#each table.columns as column (column.value)}
					<td>{column.count}</td>
				{/each}
				<td class="total">{table.total}</td>
			</tr>
		</tfoot>
	</table>
</div>

<style>
	.scroll {
		overflow-x: auto;
	}

	table {
		border-collapse: collapse;
		font-size: var(--font-size-sm);
		font-variant-numeric: tabular-nums;
	}

	th,
	td {
		padding: var(--spacing-2) var(--spacing-3);
		text-align: end;
	}

	thead th {
		font-weight: var(--font-weight-medium);
		color: var(--color-fg-muted);
		vertical-align: bottom;
	}

	tbody th,
	tfoot th,
	thead td {
		position: sticky;
		inset-inline-start: 0;
		background: var(--color-bg);
		text-align: start;
		font-weight: var(--font-weight-regular);
		overflow-wrap: anywhere;
	}

	td[style] {
		background: color-mix(in srgb, var(--color-fg) var(--shade), var(--color-bg));
	}

	td.strong a {
		color: var(--color-on-fg);
	}

	td a {
		display: block;
		text-decoration: none;
	}

	.zero {
		color: var(--color-fg-muted);
	}

	tfoot > tr > * {
		font-weight: var(--font-weight-bold);
		border-block-start: var(--border-width-hairline) solid var(--color-tag);
	}

	.total {
		font-weight: var(--font-weight-bold);
		border-inline-start: var(--border-width-hairline) solid var(--color-tag);
	}
</style>
