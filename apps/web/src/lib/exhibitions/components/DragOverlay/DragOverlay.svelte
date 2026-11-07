<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import type { DropTarget } from '#lib/exhibitions/editor/block-drop/block-drop.ts';

	type Props = {
		dropAt?: DropTarget;
		label?: string;
		x: number;
		y: number;
	};

	let { dropAt, label, x, y }: Props = $props();
</script>

{#if label !== undefined}
	<div style:left="{x}px" style:top="{y}px" class="ghost" aria-hidden="true">
		{label}
	</div>
{/if}

{#if dropAt}
	<div
		style:height="{dropAt.height}px"
		style:left="{dropAt.left}px"
		style:top="{dropAt.top}px"
		style:width="{dropAt.width}px"
		class="drop"
		class:full={dropAt.full}
		class:slot={dropAt.replaces || dropAt.beside !== undefined}
		aria-hidden="true"
	>
		{#if dropAt.full}
			{m.exhibitions.drop.full}
		{:else if dropAt.beside !== undefined}
			{m.exhibitions.drop.here}
		{/if}
	</div>
{/if}

<style>
	.ghost {
		position: fixed;
		z-index: 4;
		max-width: calc(12 * var(--spacing-6));
		padding: var(--spacing-2) var(--spacing-3);
		overflow: hidden;
		border: var(--border-width-base) solid var(--color-fg);
		background: var(--color-surface);
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		white-space: nowrap;
		text-overflow: ellipsis;
		transform: translate(var(--spacing-3), var(--spacing-3));
		pointer-events: none;
	}

	.drop {
		position: fixed;
		z-index: 2;
		display: grid;
		place-items: center;
		border-top: var(--border-width-base) solid var(--color-fg);
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		text-align: center;
		pointer-events: none;
	}

	.drop.slot {
		border: var(--border-width-base) dashed var(--color-fg);
		background: var(--color-surface);
	}
</style>
