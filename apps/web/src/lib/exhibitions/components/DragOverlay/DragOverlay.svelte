<script lang="ts">
	import type { Mark } from '#lib/exhibitions/editor/drop-target/drop-target.ts';

	type Props = {
		mark?: Mark;
		top?: number;
		label?: string;
		x: number;
		y: number;
	};

	let { mark, top = 0, label, x, y }: Props = $props();

	const shown = $derived(
		mark && {
			...mark,
			top: Math.max(mark.top, top),
			height: mark.top < top ? Math.max(0, mark.height - (top - mark.top)) : mark.height
		}
	);
</script>

{#if label !== undefined}
	<div style:left="{x}px" style:top="{y}px" class="ghost" aria-hidden="true">
		{label}
	</div>
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

	.mark {
		position: fixed;
		z-index: 3;
		background: var(--color-fg);
		pointer-events: none;
	}
</style>
