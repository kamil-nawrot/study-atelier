<script lang="ts">
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import Trash from '@lucide/svelte/icons/trash-2';
	import type { Snippet } from 'svelte';
	import { m } from '#lib/i18n/i18n.ts';

	type Props = {
		label: string;
		canUp: boolean;
		canDown: boolean;
		onmovestart: (event: PointerEvent) => void;
		onstep: (direction: -1 | 1) => void;
		onremove: () => void;
		tools?: Snippet;
	};

	let { label, canUp, canDown, onmovestart, onstep, onremove, tools }: Props = $props();
</script>

<div class="bar" aria-label={m.exhibitions.bar.label(label)} role="toolbar">
	<span
		class="handle"
		onpointerdown={onmovestart}
		role="presentation"
		title={m.exhibitions.bar.move}
	>
		<GripVertical aria-hidden="true" size={16} />
		{label}
	</span>
	{#if tools}
		<span class="tools">{@render tools()}</span>
	{/if}
	<span class="end">
		<button
			aria-label={m.exhibitions.bar.up}
			disabled={!canUp}
			onclick={() => onstep(-1)}
			title={m.exhibitions.bar.up}
			type="button"
		>
			<ArrowUp aria-hidden="true" size={16} />
		</button>
		<button
			aria-label={m.exhibitions.bar.down}
			disabled={!canDown}
			onclick={() => onstep(1)}
			title={m.exhibitions.bar.down}
			type="button"
		>
			<ArrowDown aria-hidden="true" size={16} />
		</button>
		<button
			aria-label={m.exhibitions.bar.remove}
			onclick={onremove}
			title={m.exhibitions.bar.remove}
			type="button"
		>
			<Trash aria-hidden="true" size={16} />
		</button>
	</span>
</div>

<style>
	.bar {
		display: flex;
		align-items: center;
		gap: var(--spacing-1);
		min-width: 0;
		border-bottom: var(--border-width-hairline) solid var(--color-line);
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
	}

	.handle {
		display: inline-flex;
		flex: 1 1 auto;
		align-items: center;
		gap: var(--spacing-1);
		min-width: 0;
		min-height: var(--size-control);
		overflow: hidden;
		cursor: grab;
		text-overflow: ellipsis;
		touch-action: none;
		user-select: none;
		white-space: nowrap;
	}

	.tools,
	.end {
		display: flex;
		flex: none;
	}

	.bar :global(button) {
		display: inline-grid;
		place-items: center;
		min-width: var(--size-control);
		min-height: var(--size-control);
		padding: 0;
		border: none;
		border-radius: var(--border-radius-none);
		background: transparent;
		color: inherit;
		cursor: pointer;
	}

	.bar :global(button:hover:not(:disabled)) {
		color: var(--color-fg);
	}

	.bar :global(button[aria-pressed='true']) {
		background: var(--color-fg);
		color: var(--color-on-fg);
	}

	.bar :global(button:disabled) {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.bar :global(button:focus-visible) {
		outline: var(--border-width-base) dashed currentColor;
		outline-offset: calc(-1 * var(--spacing-2));
	}

	@media (max-width: 767px) {
		.bar {
			flex-wrap: wrap;
		}

		.handle {
			flex: 1 0 auto;
			cursor: default;
		}
	}
</style>
