<script lang="ts">
	import ArrowDown from '@lucide/svelte/icons/arrow-down';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import Trash from '@lucide/svelte/icons/trash-2';
	import type { Snippet } from 'svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import PositionPicker from '#lib/exhibitions/components/PositionPicker/PositionPicker.svelte';
	import type { Position } from '#lib/exhibitions/editor/block-position/block-position.ts';

	type Props = {
		label: string;
		canUp: boolean;
		canDown: boolean;
		onmovestart: (event: PointerEvent) => void;
		onstep: (direction: -1 | 1) => void;
		onremove: () => void;
		position?: Position;
		onposition?: (position: Position) => void;
		tools?: Snippet;
	};

	let { label, canUp, canDown, onmovestart, onstep, onremove, position, onposition, tools }: Props =
		$props();
</script>

<div class="bar" aria-label={m.exhibitions.bar.label(label)} role="toolbar">
	<span
		class="handle"
		onpointerdown={onmovestart}
		role="presentation"
		title={m.exhibitions.bar.move(label)}
	>
		<GripVertical aria-hidden="true" size={16} />
		<span class="name">{label}</span>
	</span>
	<span class="end">
		{#if tools}
			<span class="tools">{@render tools()}</span>
		{/if}
		{#if position && onposition}
			<PositionPicker onpick={onposition} {position} />
		{/if}
		<button
			class="step"
			aria-label={m.exhibitions.bar.up}
			disabled={!canUp}
			onclick={() => onstep(-1)}
			title={m.exhibitions.bar.up}
			type="button"
		>
			<ArrowUp aria-hidden="true" size={16} />
		</button>
		<button
			class="step"
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
		position: absolute;
		z-index: 1;
		top: calc(-1 * var(--size-control) / 2);
		right: var(--spacing-3);
		left: var(--spacing-3);
		display: flex;
		justify-content: space-between;
		gap: var(--spacing-2);
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		line-height: var(--line-height-sm);
		pointer-events: none;
	}

	.bar > * {
		pointer-events: auto;
	}

	.handle,
	.end {
		display: inline-flex;
		align-items: center;
		min-height: var(--size-control);
		border: var(--border-width-hairline) solid var(--color-line);
		background: var(--color-bg);
	}

	.handle {
		gap: var(--spacing-2);
		min-width: 0;
		padding: 0 var(--spacing-3);
		overflow: hidden;
		color: var(--color-fg);
		cursor: grab;
		text-overflow: ellipsis;
		touch-action: none;
		user-select: none;
		white-space: nowrap;
	}

	.tools {
		display: flex;
		border-right: var(--border-width-hairline) solid var(--color-line);
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

	@container block (max-width: 400px) {
		.bar {
			right: 0;
			left: 0;
		}

		.handle {
			padding: 0;
		}

		.name {
			display: none;
		}
	}

	@container block (max-width: 300px) {
		.bar .step {
			display: none;
		}

		.bar :global(button) {
			min-width: calc(var(--size-control) - var(--spacing-2));
		}
	}

	@media (max-width: 767px) {
		.bar {
			right: 0;
			left: auto;
		}

		.handle {
			display: none;
		}
	}
</style>
