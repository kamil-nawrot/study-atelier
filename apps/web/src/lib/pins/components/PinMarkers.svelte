<script lang="ts">
	import { m } from '#lib/i18n/index.ts';
	import { fractionIn, nudged, type Fraction } from '../pin-layout.ts';
	import type { Pin } from '../types.ts';

	type Props = {
		pins: readonly Pin[];
		names?: Readonly<Record<string, string>>;
		editing?: boolean;
		draft?: Fraction & { number: number };
		onselect: (pin: Pin) => void;
		onmove?: (pin: Pin, place: Fraction) => void;
	};

	const MOVE_DISTANCE = 4;

	let { pins, names = {}, editing = false, draft, onselect, onmove }: Props = $props();

	let layer: HTMLDivElement | undefined = $state();
	let drag = $state<{ id: string; x: number; y: number }>();
	let origin: { pointer: number; x: number; y: number; moved: boolean } | undefined;

	function placeOf(pin: Pin): Fraction {
		return drag?.id === pin.id ? drag : pin;
	}

	function down(event: PointerEvent, pin: Pin): void {
		if (!editing || !event.isPrimary) return;
		event.stopPropagation();
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		origin = { pointer: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
		drag = { id: pin.id, x: pin.x, y: pin.y };
	}

	function move(event: PointerEvent): void {
		if (!origin || !drag || !layer || event.pointerId !== origin.pointer) return;
		if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) >= MOVE_DISTANCE) {
			origin.moved = true;
		}
		if (!origin.moved) return;
		drag = {
			id: drag.id,
			...fractionIn(event.clientX, event.clientY, layer.getBoundingClientRect())
		};
	}

	function up(event: PointerEvent, pin: Pin): void {
		if (!origin || !drag || event.pointerId !== origin.pointer) return;
		const finished = { moved: origin.moved, place: { x: drag.x, y: drag.y } };
		origin = undefined;
		drag = undefined;
		if (finished.moved) onmove?.(pin, finished.place);
		else onselect(pin);
	}

	function cancel(): void {
		origin = undefined;
		drag = undefined;
	}

	function click(event: MouseEvent, pin: Pin): void {
		if (editing && event.detail !== 0) return;
		onselect(pin);
	}

	function key(event: KeyboardEvent, pin: Pin): void {
		if (!editing) return;
		const place = nudged(pin, event.key);
		if (!place) return;
		event.preventDefault();
		onmove?.(pin, place);
	}
</script>

<div bind:this={layer} class="pins">
	{#each pins as pin, index (pin.id)}
		{@const place = placeOf(pin)}
		<button
			style:left="{place.x * 100}%"
			style:top="{place.y * 100}%"
			class="pin"
			class:dragging={drag?.id === pin.id}
			class:editing
			class:entry={pin.glossaryEntryId !== null}
			aria-label={m.pins.marker(
				index + 1,
				pin.glossaryEntryId ? names[pin.glossaryEntryId] : undefined
			)}
			onclick={(event) => click(event, pin)}
			onkeydown={(event) => key(event, pin)}
			onpointercancel={cancel}
			onpointerdown={(event) => down(event, pin)}
			onpointermove={move}
			onpointerup={(event) => up(event, pin)}
			type="button"
		>
			{index + 1}
		</button>
	{/each}
	{#if draft}
		<span
			style:left="{draft.x * 100}%"
			style:top="{draft.y * 100}%"
			class="pin draft"
			aria-hidden="true"
		>
			{draft.number}
		</span>
	{/if}
</div>

<style>
	.pins {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.pin {
		position: absolute;
		display: grid;
		place-items: center;
		width: var(--spacing-6);
		height: var(--spacing-6);
		padding: 0;
		border: var(--border-width-base) solid var(--color-mat-bg);
		border-radius: var(--border-radius-none);
		background: var(--color-mat-badge-bg);
		color: var(--color-mat-bg);
		font: inherit;
		font-size: var(--font-size-xs);
		font-variant-numeric: tabular-nums;
		font-weight: var(--font-weight-bold);
		line-height: 1;
		pointer-events: auto;
		translate: -50% -50%;
		cursor: pointer;
	}

	.pin::before {
		content: '';
		position: absolute;
		inset: calc(-1 * var(--spacing-2));
	}

	.pin.entry {
		background: var(--color-mat-bg);
		color: var(--color-mat-fg);
	}

	.pin:focus-visible {
		outline: var(--border-width-base) dashed var(--color-mat-bg);
		outline-offset: var(--border-width-base);
	}

	.pin.editing {
		cursor: grab;
		touch-action: none;
	}

	.pin.dragging {
		z-index: 1;
		cursor: grabbing;
	}

	.draft {
		pointer-events: none;
	}
</style>
