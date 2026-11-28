<script lang="ts">
	import { Notes } from '@study-atelier/ui';
	import type { DisplayRow } from '#lib/compare/types/display-row.ts';
	import type { RowCellItem } from '#lib/compare/types/row-cell-item.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		rows: DisplayRow[];
	};

	let { rows }: Props = $props();

	const id = $props.id();
</script>

{#snippet cell(content: RowCellItem[], text: boolean)}
	{#if content.length === 0}
		<span class="empty">
			<span aria-hidden="true">—</span>
			<span class="visually-hidden">{m.artworkView.empty}</span>
		</span>
	{:else}
		<div class="items" class:text>
			{#each content as item, index (index)}
				<div class="item">
					{#if text}
						<Notes value={item.text} />
					{:else}
						{item.text}
					{/if}
					{#if item.isNew}
						<span class="new">{m.compare.newValue}</span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
{/snippet}

<div class="rows">
	{#each rows as row (row.key)}
		<div class="row" aria-labelledby="{id}-{row.key}" role="group">
			<p id="{id}-{row.key}" class="label">{row.label}</p>
			<p class="label twin" aria-hidden="true">{row.label}</p>
			<div class="value left">
				{@render cell(row.left, row.text ?? false)}
			</div>
			<div class="value right">
				{@render cell(row.right, row.text ?? false)}
			</div>
		</div>
	{/each}
</div>

<style>
	.rows {
		display: grid;
		padding: var(--spacing-4) 0 var(--spacing-12);
	}

	.row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-1) var(--spacing-8);
		padding: var(--spacing-3) 0;
		border-top: var(--border-width-hairline) solid var(--color-tag);
	}

	.label {
		grid-column: 1 / -1;
		margin: 0;
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.twin {
		display: none;
	}

	.value {
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.left {
		grid-column: 1;
	}

	.right {
		grid-column: 2;
	}

	.items {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-1) var(--spacing-3);
	}

	.items.text {
		display: grid;
	}

	.new,
	.empty {
		color: var(--color-fg-muted);
	}

	.item {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--spacing-1);
	}

	.new {
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	@media (min-width: 768px) {
		.row {
			column-gap: var(--spacing-12);
		}

		.label {
			grid-row: 1;
			grid-column: 1;
		}

		.twin {
			display: block;
			grid-column: 2;
		}
	}
</style>
