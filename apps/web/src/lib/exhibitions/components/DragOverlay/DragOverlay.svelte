<script lang="ts">
	import type { Box, Mark } from '#lib/exhibitions/editor/drop-target/drop-target.ts';

	type Props = {
		mark?: Mark;
		top?: number;
		label?: string;
		x: number;
		y: number;
	};

	let { mark, top = 0, label, x, y }: Props = $props();

	function below<T extends Box>(box: T): T {
		return {
			...box,
			top: Math.max(box.top, top),
			height: box.top < top ? Math.max(0, box.height - (top - box.top)) : box.height
		};
	}

	const shown = $derived(mark && below(mark));
	const slot = $derived(mark && below(mark.slot));
</script>

{#if label !== undefined}
	<div style:left="{x}px" style:top="{y}px" class="ghost" aria-hidden="true">
		{label}
	</div>
	{#if slot}
		<div
			style:height="{slot.height}px"
			style:left="{slot.left}px"
			style:top="{slot.top}px"
			style:width="{slot.width}px"
			class="slot"
			aria-hidden="true"
		></div>
	{/if}
	{#if shown}
		<div
			style:height="{shown.height}px"
			style:left="{shown.left}px"
			style:top="{shown.top}px"
			style:width="{shown.width}px"
			class="mark"
			aria-hidden="true"
			data-side={shown.side ? '' : undefined}
		></div>
	{/if}
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

	.slot {
		position: fixed;
		z-index: 3;
		box-sizing: border-box;
		display: grid;
		place-items: center;
		border: var(--border-width-base) dashed var(--color-fg);
		background: color-mix(in srgb, var(--color-fg) 8%, transparent);
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		pointer-events: none;
	}

	.mark {
		position: fixed;
		z-index: 3;
		background: var(--color-fg);
		pointer-events: none;
	}
</style>
