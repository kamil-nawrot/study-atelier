<script lang="ts">
	import Bold from '@lucide/svelte/icons/bold';
	import Italic from '@lucide/svelte/icons/italic';
	import { Icon } from '@study-atelier/ui';
	import { m } from '#lib/i18n/i18n.ts';
	import { barPosition } from '#lib/exhibitions/block-bar-position/block-bar-position.ts';
	import type { TextKind } from '#lib/exhibitions/editor/block-commands/block-commands.ts';
	import type { BlockBarState } from '#lib/exhibitions/types/block-bar-state.ts';

	type Props = {
		bar: BlockBarState;
		column: HTMLElement;
		topLimit: number;
		onconvert: (kind: TextKind) => void;
		onmovestart: (event: DragEvent) => void;
		onnote: () => void;
		onpalette: (only: boolean) => void;
		oncloseup: () => void;
		onremove: () => void;
		onstep: (direction: -1 | 1) => void;
		ontoggle: (mark: 'bold' | 'italic') => void;
	};

	let {
		bar,
		column,
		topLimit,
		onconvert,
		onmovestart,
		onnote,
		onpalette,
		oncloseup,
		onremove,
		onstep,
		ontoggle
	}: Props = $props();

	const kinds: { kind: TextKind; label: string }[] = [
		{ kind: 'textBlock', label: m.exhibitions.bar.paragraph },
		{ kind: 'heading', label: m.exhibitions.bar.heading },
		{ kind: 'quote', label: m.exhibitions.bar.quote }
	];

	let width = $state(0);
	let height = $state(0);

	let isText = $derived(bar.kind !== 'artwork' && bar.kind !== 'closeUp');
	let position = $derived(
		barPosition(bar.rect, { width, height }, column.getBoundingClientRect(), topLimit)
	);
</script>

<div
	style:left="{position.left}px"
	style:top="{position.top}px"
	class="bar"
	aria-label={m.exhibitions.bar.label}
	onmousedown={(event) => {
		if (!(event.target instanceof Element && event.target.closest('.handle')))
			event.preventDefault();
	}}
	role="toolbar"
	tabindex="-1"
	bind:clientHeight={height}
	bind:clientWidth={width}
>
	<span class="handle" draggable="true" ondragstart={onmovestart} role="button" tabindex="-1">
		{m.exhibitions.bar.move}
	</span>
	<button disabled={bar.index === 0} onclick={() => onstep(-1)} type="button">
		{bar.row ? m.exhibitions.bar.left : m.exhibitions.bar.up}
	</button>
	<button disabled={bar.index >= bar.count - 1} onclick={() => onstep(1)} type="button">
		{bar.row ? m.exhibitions.bar.right : m.exhibitions.bar.down}
	</button>
	<span class="separator"></span>
	{#if isText}
		<div class="group" aria-label={m.exhibitions.bar.kind} role="group">
			{#each kinds as { kind, label } (kind)}
				<button aria-pressed={bar.kind === kind} onclick={() => onconvert(kind)} type="button">
					{label}
				</button>
			{/each}
		</div>
		<span class="separator"></span>
		{#if bar.kind !== 'heading'}
			<button
				aria-label={m.exhibitions.bar.bold}
				aria-pressed={bar.bold}
				onclick={() => ontoggle('bold')}
				title={m.exhibitions.bar.bold}
				type="button"
			>
				<Icon icon={Bold} size="sm" />
			</button>
		{/if}
		<button
			aria-label={m.exhibitions.bar.italic}
			aria-pressed={bar.italic}
			onclick={() => ontoggle('italic')}
			title={m.exhibitions.bar.italic}
			type="button"
		>
			<Icon icon={Italic} size="sm" />
		</button>
	{:else}
		{#if bar.kind === 'artwork'}
			<button
				aria-pressed={bar.palette && !bar.paletteOnly}
				onclick={() => onpalette(false)}
				type="button"
			>
				{m.exhibitions.bar.palette}
			</button>
			<button aria-pressed={bar.paletteOnly} onclick={() => onpalette(true)} type="button">
				{m.exhibitions.bar.paletteOnly}
			</button>
			<button aria-pressed={bar.note} onclick={onnote} type="button">
				{m.exhibitions.bar.note}
			</button>
			<button onclick={oncloseup} type="button">
				{m.exhibitions.bar.closeUp}
			</button>
			<span class="separator"></span>
		{/if}
		<button onclick={onremove} type="button">
			{m.exhibitions.bar.remove}
		</button>
	{/if}
</div>

<style>
	.bar {
		position: fixed;
		z-index: 2;
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		border: var(--border-width-base) solid var(--color-line);
		background: var(--color-surface);
		color: var(--color-fg);
		font-size: var(--font-size-sm);
	}

	.group {
		display: flex;
	}

	.separator {
		align-self: stretch;
		width: var(--border-width-hairline);
		background: var(--color-line);
	}

	button,
	.handle {
		display: inline-flex;
		align-items: center;
		min-height: var(--size-control);
		padding: 0 var(--spacing-3);
		border: none;
		border-radius: var(--border-radius-none);
		background: transparent;
		color: inherit;
		font: inherit;
		cursor: pointer;
	}

	.handle {
		cursor: grab;
	}

	button[aria-pressed='true'] {
		background: var(--color-fg);
		color: var(--color-on-fg);
	}

	button:disabled {
		color: var(--color-fg-muted);
		cursor: not-allowed;
	}

	button:focus-visible {
		outline: var(--border-width-base) dashed currentColor;
		outline-offset: calc(-1 * var(--spacing-2));
	}
</style>
