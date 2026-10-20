<script lang="ts">
	import type { Snippet } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { m } from '#lib/i18n/index.ts';
	import { axisKind, lineTimes, segments, tickYears } from '../axis.ts';
	import { segmentLabel } from '../labels.ts';
	import { stageGeometry, stageHeight, type StageGeometry } from '../stage.ts';
	import { timeOf, yearAt, type Era, type View } from '../time.ts';

	type Props = {
		era: Era;
		view: View;
		eventLanes?: number;
		onpan: (by: number) => void;
		onstep: (direction: 1 | -1, anchor?: number) => void;
		events?: Snippet<[StageGeometry]>;
		artworks?: Snippet<[StageGeometry]>;
	};

	let { era, view, eventLanes = 1, onpan, onstep, events, artworks }: Props = $props();

	const DRAG_THRESHOLD = 6;
	const PINCH_STEP = 1.4;
	const WHEEL_STEP = 60;
	const WHEEL_PAUSE_MS = 380;
	const KEY_PAN = 0.25;

	let width = $state(0);
	let stage = $state<HTMLDivElement>();

	let geometry = $derived(stageGeometry(view, width, eventLanes));
	let height = $derived(stageHeight(geometry));
	let before = $derived(Math.max(0, geometry.position(era.start)));
	let after = $derived(Math.max(0, width - geometry.position(era.end)));
	let kind = $derived(axisKind(view));
	let unit = $derived<100 | 1000>(kind === 'millennia' ? 1000 : 100);
	let labels = $derived(
		kind === 'years'
			? []
			: segments(view, unit)
					.filter((segment) => segment.end > era.start && segment.start < era.end)
					.map((segment) => {
						const from = Math.max(geometry.position(Math.max(segment.start, era.start)), 0);
						const to = Math.min(geometry.position(Math.min(segment.end, era.end)), width);
						return { key: `${unit}:${segment.start}`, text: segmentLabel(segment, unit), from, to };
					})
					.filter((label) => label.to - label.from > 48)
	);
	let ticks = $derived(
		tickYears(view)
			.map((year) => ({ year, at: geometry.position(timeOf(year)) }))
			.filter((tick) => tick.at >= 0 && tick.at <= width)
	);
	let lines = $derived(
		lineTimes(view, width, era).map((time) => ({ time, at: geometry.position(time) }))
	);
	let readingYear = $derived(yearAt(view.center));

	const pointers = new SvelteMap<number, { x: number; y: number }>();
	let drag: { id: number; x: number; center: number; moved: boolean } | null = null;
	let pinch: { distance: number } | null = null;
	let suppressClick = false;
	let wheelTotal = 0;
	let wheelPausedUntil = 0;

	function anchorOf(clientX: number): number {
		const box = stage?.getBoundingClientRect();
		if (!box || box.width === 0) return 0.5;
		return Math.min(Math.max((clientX - box.left) / box.width, 0), 1);
	}

	function distance(): number {
		const [a, b] = [...pointers.values()];
		return Math.hypot(a.x - b.x, a.y - b.y);
	}

	function pointerDown(event: PointerEvent): void {
		pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		if (pointers.size === 1) {
			drag = { id: event.pointerId, x: event.clientX, center: view.center, moved: false };
		} else if (pointers.size === 2) {
			drag = null;
			pinch = { distance: distance() };
		}
	}

	function pointerMove(event: PointerEvent): void {
		if (!pointers.has(event.pointerId)) return;
		pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		if (pinch && pointers.size === 2) {
			const [a, b] = [...pointers.values()];
			const ratio = distance() / pinch.distance;
			const anchor = anchorOf((a.x + b.x) / 2);
			if (ratio > PINCH_STEP) {
				onstep(1, anchor);
				pinch = { distance: distance() };
			} else if (ratio < 1 / PINCH_STEP) {
				onstep(-1, anchor);
				pinch = { distance: distance() };
			}
			return;
		}
		if (!drag || drag.id !== event.pointerId) return;
		const moved = event.clientX - drag.x;
		if (!drag.moved && Math.abs(moved) < DRAG_THRESHOLD) return;
		if (!drag.moved) {
			drag.moved = true;
			stage?.setPointerCapture(event.pointerId);
		}
		onpan(drag.center - (moved / Math.max(width, 1)) * view.span - view.center);
	}

	function pointerUp(event: PointerEvent): void {
		pointers.delete(event.pointerId);
		if (drag?.id === event.pointerId) {
			if (drag.moved) suppressClick = true;
			drag = null;
		}
		if (pointers.size < 2) pinch = null;
	}

	function clickCapture(event: MouseEvent): void {
		if (!suppressClick) return;
		suppressClick = false;
		event.stopPropagation();
		event.preventDefault();
	}

	function wheel(event: WheelEvent): void {
		event.preventDefault();
		if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey) {
			const by = event.shiftKey ? event.deltaY : event.deltaX;
			onpan((by / Math.max(width, 1)) * view.span);
			return;
		}
		const now = performance.now();
		if (now < wheelPausedUntil) return;
		wheelTotal += event.deltaY;
		if (Math.abs(wheelTotal) < WHEEL_STEP) return;
		onstep(wheelTotal < 0 ? 1 : -1, anchorOf(event.clientX));
		wheelTotal = 0;
		wheelPausedUntil = now + WHEEL_PAUSE_MS;
	}

	function keydown(event: KeyboardEvent): void {
		if (event.target !== stage) return;
		if (event.key === 'ArrowLeft') onpan(-KEY_PAN * view.span);
		else if (event.key === 'ArrowRight') onpan(KEY_PAN * view.span);
		else if (event.key === '+' || event.key === '=') onstep(1);
		else if (event.key === '-') onstep(-1);
		else return;
		event.preventDefault();
	}

	$effect(() => {
		const element = stage;
		if (!element) return;
		element.addEventListener('wheel', wheel, { passive: false });
		return () => element.removeEventListener('wheel', wheel);
	});
</script>

<div
	bind:this={stage}
	style:height={`${height}px`}
	style:--events-top={`${geometry.eventsTop}px`}
	style:--events-height={`${geometry.eventsHeight}px`}
	style:--artworks-top={`${geometry.artworksTop}px`}
	class="stage"
	aria-label={m.timeline.stage}
	aria-valuemax={yearAt(era.end - 1)}
	aria-valuemin={yearAt(era.start)}
	aria-valuenow={readingYear}
	aria-valuetext={m.atelier.year(readingYear, false)}
	onclickcapture={clickCapture}
	onkeydown={keydown}
	onpointercancel={pointerUp}
	onpointerdown={pointerDown}
	onpointermove={pointerMove}
	onpointerup={pointerUp}
	role="slider"
	tabindex="0"
	bind:clientWidth={width}
>
	<div class="zone events-zone" aria-hidden="true"></div>
	<span style:left={`${before}px`} class="zone-label events-label" aria-hidden="true">
		{m.timeline.zones.events}
	</span>
	<span style:left={`${before}px`} class="zone-label artworks-label" aria-hidden="true">
		{m.timeline.zones.artworks}
	</span>

	{#each lines as line (line.time)}
		<div style:left={`${Math.round(line.at)}px`} class="line" aria-hidden="true"></div>
	{/each}

	<div class="axis" aria-hidden="true">
		{#each labels as label (label.key)}
			<span
				style:left={`${label.from}px`}
				style:max-width={`${label.to - label.from}px`}
				class="segment"
			>
				{label.text}
			</span>
		{/each}
		{#each ticks as tick (tick.year)}
			<span style:left={`${tick.at}px`} class="tick">{m.atelier.year(tick.year, false)}</span>
		{/each}
	</div>

	{#if events}
		{@render events(geometry)}
	{/if}
	{#if artworks}
		{@render artworks(geometry)}
	{/if}

	{#if before > 0}
		<div style:width={`${before}px`} class="outside start" aria-hidden="true"></div>
	{/if}
	{#if after > 0}
		<div style:width={`${after}px`} class="outside end" aria-hidden="true"></div>
	{/if}

	<div class="reading" aria-hidden="true">
		<span class="reading-year">{m.atelier.year(readingYear, false)}</span>
	</div>
</div>

<style>
	.stage {
		position: relative;
		overflow: hidden;
		border-block: var(--border-width-hairline) solid var(--color-tag);
		touch-action: none;
		cursor: grab;
		user-select: none;
	}

	.stage:active {
		cursor: grabbing;
	}

	.zone {
		position: absolute;
		top: calc(var(--events-top) - var(--spacing-6));
		right: 0;
		left: 0;
		height: calc(var(--events-height) + var(--spacing-6));
		border-bottom: var(--border-width-hairline) solid var(--color-tag);
		background: var(--color-surface);
	}

	.zone-label {
		position: absolute;
		z-index: 2;
		padding-left: var(--spacing-2);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		letter-spacing: var(--letter-spacing-wide);
		text-transform: uppercase;
	}

	.events-label {
		top: calc(var(--events-top) - var(--spacing-4) - var(--spacing-1));
	}

	.artworks-label {
		top: calc(var(--artworks-top) - var(--spacing-4) - var(--spacing-1));
	}

	.line {
		position: absolute;
		top: 0;
		bottom: 0;
		width: var(--border-width-hairline);
		background: var(--color-tag);
	}

	.axis {
		position: absolute;
		top: 0;
		right: 0;
		left: 0;
		height: var(--spacing-12);
		border-bottom: var(--border-width-hairline) solid var(--color-tag);
	}

	.segment {
		position: absolute;
		top: var(--spacing-2);
		overflow: hidden;
		padding-inline: var(--spacing-2);
		font-size: var(--font-size-md);
		white-space: nowrap;
	}

	.tick {
		position: absolute;
		top: calc(var(--spacing-6) + var(--spacing-1));
		padding-left: var(--spacing-1);
		border-left: var(--border-width-hairline) solid var(--color-tag);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.outside {
		position: absolute;
		top: 0;
		bottom: 0;
		z-index: 3;
		background: var(--color-tag);
	}

	.outside.start {
		left: 0;
		border-right: var(--border-width-hairline) solid var(--color-fg-muted);
	}

	.outside.end {
		right: 0;
		border-left: var(--border-width-hairline) solid var(--color-fg-muted);
	}

	.reading {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		z-index: 4;
		width: 0;
		border-left: var(--border-width-hairline) solid var(--color-highlight);
		pointer-events: none;
	}

	.reading-year {
		position: absolute;
		bottom: var(--spacing-2);
		padding-inline: var(--spacing-2);
		background: var(--color-highlight);
		color: var(--color-on-fg);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-medium);
		font-variant-numeric: tabular-nums;
		transform: translateX(-50%);
	}
</style>
