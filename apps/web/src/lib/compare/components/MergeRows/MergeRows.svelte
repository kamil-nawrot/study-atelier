<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import { Checkbox, Icon, Notes } from '@study-atelier/ui';
	import type { MergeRow, TickItem } from '#lib/compare/types/merge-row.ts';
	import type { RowCellItem } from '#lib/compare/types/row-cell-item.ts';
	import { artworkImageSource } from '#lib/images/artwork-image/artwork-image.ts';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		rows: MergeRow[];
	};

	let { rows }: Props = $props();

	const id = $props.id();
	const THUMB_WIDTH = 160;
</script>

{#snippet value(item: TickItem, text: boolean)}
	{#if item.image}
		{@const source = artworkImageSource(item.image, THUMB_WIDTH)}
		<span class="thumb">
			{#if source}
				<img alt="" height={source.height} src={source.src} width={source.width} />
			{/if}
			{#if item.credit}
				<span class="credit">{item.credit}</span>
			{/if}
		</span>
	{:else if text}
		<Notes value={item.text} />
	{:else}
		{item.text}
	{/if}
	{#if item.isNew}
		<span class="new">{m.compare.newValue}</span>
	{/if}
{/snippet}

{#snippet values(items: RowCellItem[], text: boolean)}
	{#if items.length === 0}
		<span class="empty">{m.compare.empty}</span>
	{:else}
		<span class="items" class:text>
			{#each items as item, index (index)}
				<span class="item">{@render value(item, text)}</span>
			{/each}
		</span>
	{/if}
{/snippet}

{#snippet ticks(items: TickItem[], text: boolean)}
	{#if items.length === 0}
		<span class="empty">{m.compare.empty}</span>
	{:else}
		<span class="items" class:text>
			{#each items as item, index (index)}
				{#if item.ontoggle}
					<span class="tick" class:on={item.ticked}>
						<Checkbox
							checked={item.ticked}
							disabled={item.disabled && !item.ticked}
							onchange={item.ontoggle}
						>
							{#if text}
								<span class="note-tick">{m.compare.appendNote}</span>
							{/if}
							{@render value(item, text)}
						</Checkbox>
					</span>
				{:else}
					<span class="item">{@render value(item, text)}</span>
				{/if}
			{/each}
		</span>
	{/if}
{/snippet}

{#snippet choice(items: RowCellItem[], picked: boolean, onpick: () => void, text: boolean)}
	<button
		class="cell"
		class:picked
		aria-label={m.compare.keep(items.map((item) => item.text).join(', ') || m.compare.empty)}
		aria-pressed={picked}
		onclick={onpick}
		type="button"
	>
		{@render values(items, text)}
		<span class="mark" aria-hidden="true">
			{#if picked}
				<Icon icon={Check} size="xs" />
			{/if}
		</span>
	</button>
{/snippet}

<div class="rows">
	<p class="head" aria-hidden="true"><span>{m.compare.mine}</span><span>{m.compare.album}</span></p>
	{#each rows as row (row.key)}
		<div class="row" aria-labelledby="{id}-{row.key}" role="group">
			<p id="{id}-{row.key}" class="label">{row.label}</p>
			{#if row.kind === 'pick'}
				{@render choice(row.mine, !row.fromAlbum, () => row.onpick(false), row.text ?? false)}
				{@render choice(row.album, row.fromAlbum, () => row.onpick(true), row.text ?? false)}
			{:else if row.kind === 'tick'}
				<div class="side">{@render ticks(row.mine, row.text ?? false)}</div>
				<div class="side">{@render ticks(row.album, row.text ?? false)}</div>
			{:else if row.kind === 'same'}
				<p class="same">
					{@render values(row.value, row.text ?? false)}
					<span class="muted">· {m.compare.same}</span>
				</p>
			{:else}
				<div class="side">{@render values(row.mine, row.text ?? false)}</div>
				<div class="side">{@render values(row.album, row.text ?? false)}</div>
			{/if}
		</div>
	{/each}
</div>

<style>
	.rows {
		display: grid;
		padding: var(--spacing-4) 0 var(--spacing-12);
	}

	.head,
	.row {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-2) var(--spacing-4);
	}

	.head {
		margin: 0;
		padding-bottom: var(--spacing-2);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.row {
		align-items: start;
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

	.side {
		min-width: 0;
		overflow-wrap: anywhere;
	}

	.same {
		grid-column: 1 / -1;
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-1) var(--spacing-2);
		margin: 0;
	}

	.cell {
		position: relative;
		display: flex;
		align-items: center;
		min-width: 0;
		min-height: var(--size-control);
		padding: var(--spacing-3) var(--spacing-12) var(--spacing-3) var(--spacing-4);
		border: var(--border-width-hairline) solid var(--color-line);
		background: transparent;
		color: var(--color-fg-muted);
		font: inherit;
		text-align: start;
		overflow-wrap: break-word;
		cursor: pointer;
	}

	.cell:hover:not(.picked) {
		background: var(--color-surface);
	}

	.cell.picked {
		border: var(--border-width-base) solid var(--color-highlight);
		background: color-mix(in srgb, var(--color-highlight) 10%, transparent);
		color: var(--color-fg);
	}

	.cell:focus-visible {
		outline: var(--border-width-base) dashed var(--color-fg);
		outline-offset: var(--border-width-base);
	}

	.mark {
		position: absolute;
		top: 50%;
		right: var(--spacing-3);
		display: grid;
		place-items: center;
		width: calc(var(--spacing-4) + var(--spacing-1));
		height: calc(var(--spacing-4) + var(--spacing-1));
		border: var(--border-width-base) solid var(--color-line);
		translate: 0 -50%;
	}

	.picked .mark {
		border-color: var(--color-highlight);
		background: var(--color-highlight);
		color: var(--color-bg);
	}

	.items {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-2) var(--spacing-3);
	}

	.items.text {
		display: grid;
	}

	.item {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--spacing-1);
	}

	.tick {
		display: inline-flex;
		padding: var(--spacing-2) var(--spacing-3);
		border: var(--border-width-hairline) solid var(--color-line);
		color: var(--color-fg-muted);
	}

	.tick.on {
		border-color: var(--color-highlight);
		color: var(--color-fg);
	}

	.tick :global(.checkbox) {
		align-items: start;
		font-size: inherit;
		line-height: inherit;
	}

	.note-tick {
		display: block;
		padding-bottom: var(--spacing-1);
		color: var(--color-fg);
		font-size: var(--font-size-sm);
	}

	.thumb {
		display: grid;
		gap: var(--spacing-1);
	}

	.thumb img {
		display: block;
		width: auto;
		max-width: 100%;
		height: auto;
		max-height: 96px;
	}

	.credit,
	.new {
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		line-height: var(--line-height-xs);
	}

	.empty,
	.muted {
		color: var(--color-fg-muted);
	}

	@media (min-width: 768px) {
		.head,
		.row {
			grid-template-columns: 9rem repeat(2, minmax(0, 1fr));
			column-gap: var(--spacing-6);
		}

		.head::before {
			content: '';
		}

		.label {
			grid-column: 1;
			padding-top: var(--spacing-3);
		}

		.same {
			grid-column: 2 / -1;
			padding-top: var(--spacing-3);
		}
	}
</style>
