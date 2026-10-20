<script lang="ts">
	import type { Snippet } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { m } from '#lib/i18n/index.ts';
	import { axisKind, lineTimes, segments, tickYears } from '../axis.ts';
	import { segmentLabel } from '../labels.ts';
	import {
		boxStyle,
		stageGeometry,
		stageSize,
		type Orientation,
		type StageGeometry
	} from '../stage.ts';
	import { timeOf, yearAt, type Era, type TimeSpan, type View } from '../time.ts';

	type Props = {
		era: Era;
		view: View;
		orientation?: Orientation;
		eventLanes?: number;
		tint?: TimeSpan;
		onpan: (by: number) => void;
		onkeypan: (share: number) => void;
		onbackground?: () => void;
		onstep: (direction: 1 | -1, anchor?: number) => void;
		events?: Snippet<[StageGeometry]>;
		artworks?: Snippet<[StageGeometry]>;
	};

	let {
		era,
		view,
		orientation = 'horizontal',
		eventLanes = 1,
		tint,
		onpan,
		onkeypan,
		onbackground,
		onstep,
		events,
		artworks
	}: Props = $props();

	const DRAG_THRESHOLD = 6;
	const PINCH_STEP = 1.4;
	const WHEEL_STEP = 60;
	const WHEEL_PAUSE_MS = 380;
	const KEY_PAN = 0.25;
	const LABEL_MIN = 48;
	const LABEL_MIN_VERTICAL = 24;

	let width = $state(0);
	let viewportHeight = $state(0);
	let stage = $state<HTMLDivElement>();

	let vertical = $derived(orientation === 'vertical');
	let geometry = $derived(stageGeometry(view, width, eventLanes, orientation, viewportHeight));
	let size = $derived(stageSize(geometry));
	let length = $derived(geometry.length);
	let before = $derived(Math.max(0, geometry.position(era.start)));
	let after = $derived(Math.max(0, length - geometry.position(era.end)));
	let kind = $derived(axisKind(view));
	let unit = $derived<100 | 1000>(kind === 'millennia' ? 1000 : 100);
	let labels = $derived(
		kind === 'years'
			? []
			: segments(view, unit)
					.filter((segment) => segment.end > era.start && segment.start < era.end)
					.map((segment) => {
						const from = Math.max(geometry.position(Math.max(segment.start, era.start)), 0);
						const to = Math.min(geometry.position(Math.min(segment.end, era.end)), length);
						return { key: `${unit}:${segment.start}`, text: segmentLabel(segment, unit), from, to };
					})
					.filter((label) => label.to - label.from > (vertical ? LABEL_MIN_VERTICAL : LABEL_MIN))
	);
	let ticks = $derived(
		tickYears(view)
			.map((year) => ({ year, at: geometry.position(timeOf(year)) }))
			.filter((tick) => tick.at >= 0 && tick.at <= length)
	);
	let lines = $derived(
		lineTimes(view, length, era).map((time) => ({ time, at: geometry.position(time) }))
	);
	let readingYear = $derived(yearAt(view.center));

	const pointers = new SvelteMap<number, { x: number; y: number }>();
	let drag: { id: number; at: number; center: number; moved: boolean } | null = null;
	let pinch: { distance: number } | null = null;
	let suppressClick = false;
	let wheelTotal = 0;
	let wheelPausedUntil = 0;

	function along(point: { clientX: number; clientY: number }): number {
		return vertical ? point.clientY : point.clientX;
	}

	function anchorOf(at: number): number {
		const box = stage?.getBoundingClientRect();
		if (!box) return 0.5;
		const extent = vertical ? box.height : box.width;
		if (extent === 0) return 0.5;
		return Math.min(Math.max((at - (vertical ? box.top : box.left)) / extent, 0), 1);
	}

	function distance(): number {
		const [a, b] = [...pointers.values()];
		return Math.hypot(a.x - b.x, a.y - b.y);
	}

	function pointerDown(event: PointerEvent): void {
		pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		if (pointers.size === 1) {
			drag = { id: event.pointerId, at: along(event), center: view.center, moved: false };
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
			const anchor = anchorOf(vertical ? (a.y + b.y) / 2 : (a.x + b.x) / 2);
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
		const moved = along(event) - drag.at;
		if (!drag.moved && Math.abs(moved) < DRAG_THRESHOLD) return;
		if (!drag.moved) {
			drag.moved = true;
			stage?.setPointerCapture(event.pointerId);
		}
		onpan(drag.center - (moved / Math.max(length, 1)) * view.span - view.center);
	}

	function pointerUp(event: PointerEvent): void {
		pointers.delete(event.pointerId);
		if (drag?.id === event.pointerId) {
			if (drag.moved) suppressClick = true;
			drag = null;
		}
		if (pointers.size < 2) pinch = null;
	}

	function backgroundClick(event: MouseEvent): void {
		if (event.target instanceof Element && event.target.closest('button, a')) return;
		onbackground?.();
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
			onpan((by / Math.max(length, 1)) * view.span);
			return;
		}
		const now = performance.now();
		if (now < wheelPausedUntil) return;
		wheelTotal += event.deltaY;
		if (Math.abs(wheelTotal) < WHEEL_STEP) return;
		onstep(wheelTotal < 0 ? 1 : -1, anchorOf(along(event)));
		wheelTotal = 0;
		wheelPausedUntil = now + WHEEL_PAUSE_MS;
	}

	function keydown(event: KeyboardEvent): void {
		if (event.target !== stage) return;
		if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') onkeypan(-KEY_PAN);
		else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') onkeypan(KEY_PAN);
		else if (event.key === '+' || event.key === '=') onstep(1);
		else if (event.key === '-') onstep(-1);
		else if (event.key === 'Escape') onbackground?.();
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

<svelte:window bind:innerHeight={viewportHeight} />

<div
	bind:this={stage}
	style:height={`${size.height}px`}
	style:--events-from={`${geometry.eventsFrom}px`}
	style:--events-size={`${geometry.eventsSize}px`}
	style:--artworks-from={`${geometry.artworksFrom}px`}
	class="stage"
	class:vertical
	aria-label={m.timeline.stage}
	aria-orientation={orientation}
	aria-valuemax={yearAt(era.end - 1)}
	aria-valuemin={yearAt(era.start)}
	aria-valuenow={readingYear}
	aria-valuetext={m.atelier.year(readingYear, false)}
	onclick={backgroundClick}
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
	<div class="zone" aria-hidden="true"></div>
	{#if !vertical}
		<span style:left={`${before}px`} class="zone-label events-label" aria-hidden="true">
			{m.timeline.zones.events}
		</span>
		<span style:left={`${before}px`} class="zone-label artworks-label" aria-hidden="true">
			{m.timeline.zones.artworks}
		</span>
	{/if}

	{#each lines as line (line.time)}
		<div
			style={boxStyle(geometry, { along: Math.round(line.at), across: 0 })}
			class="line"
			aria-hidden="true"
		></div>
	{/each}

	<div class="axis" aria-hidden="true">
		{#each labels as label (label.key)}
			<span
				style={boxStyle(geometry, {
					along: label.from,
					across: 0,
					...(vertical ? {} : { alongSize: label.to - label.from })
				})}
				class="segment"
			>
				{label.text}
			</span>
		{/each}
		{#each ticks as tick (tick.year)}
			<span style={boxStyle(geometry, { along: tick.at, across: 0 })} class="tick">
				{m.atelier.year(tick.year, false)}
			</span>
		{/each}
	</div>

	{#if tint && tint.end > era.start && tint.start < era.end}
		{@const from = geometry.position(Math.max(tint.start, era.start))}
		{@const to = geometry.position(Math.min(tint.end, era.end))}
		<div
			style={boxStyle(geometry, {
				along: from,
				across: geometry.eventsFrom,
				alongSize: Math.max(to - from, 2)
			})}
			class="tint"
			aria-hidden="true"
		></div>
	{/if}

	{#if events}
		{@render events(geometry)}
	{/if}
	{#if artworks}
		{@render artworks(geometry)}
	{/if}

	{#if before > 0}
		<div
			style={boxStyle(geometry, { along: 0, across: 0, alongSize: before })}
			class="outside start"
			aria-hidden="true"
		></div>
	{/if}
	{#if after > 0}
		<div
			style={boxStyle(geometry, { along: length - after, across: 0, alongSize: after })}
			class="outside end"
			aria-hidden="true"
		></div>
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
		top: calc(var(--events-from) - var(--spacing-6));
		right: 0;
		left: 0;
		height: calc(var(--events-size) + var(--spacing-6));
		border-bottom: var(--border-width-hairline) solid var(--color-tag);
		background: var(--color-surface);
	}

	.vertical .zone {
		top: 0;
		right: auto;
		bottom: 0;
		left: calc(var(--events-from) - var(--spacing-1));
		width: calc(var(--events-size) + var(--spacing-2));
		height: auto;
		border-right: var(--border-width-hairline) solid var(--color-tag);
		border-bottom: 0;
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
		top: calc(var(--events-from) - var(--spacing-4) - var(--spacing-1));
	}

	.artworks-label {
		top: calc(var(--artworks-from) - var(--spacing-4) - var(--spacing-1));
	}

	.line {
		position: absolute;
		bottom: 0;
		width: var(--border-width-hairline);
		background: var(--color-tag);
	}

	.vertical .line {
		right: 0;
		bottom: auto;
		width: auto;
		height: var(--border-width-hairline);
	}

	.axis {
		position: absolute;
		top: 0;
		right: 0;
		left: 0;
		height: var(--spacing-12);
		border-bottom: var(--border-width-hairline) solid var(--color-tag);
	}

	.vertical .axis {
		right: auto;
		bottom: 0;
		width: var(--spacing-16);
		height: auto;
		border-right: var(--border-width-hairline) solid var(--color-tag);
		border-bottom: 0;
	}

	.segment {
		position: absolute;
		overflow: hidden;
		padding: var(--spacing-2) var(--spacing-2) 0;
		font-size: var(--font-size-md);
		white-space: nowrap;
	}

	.vertical .segment {
		width: var(--spacing-16);
		padding: var(--spacing-1) var(--spacing-2);
		font-size: var(--font-size-sm);
		white-space: normal;
	}

	.tick {
		position: absolute;
		margin-top: calc(var(--spacing-6) + var(--spacing-1));
		padding-left: var(--spacing-1);
		border-left: var(--border-width-hairline) solid var(--color-tag);
		color: var(--color-fg-muted);
		font-size: var(--font-size-xs);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.vertical .tick {
		width: var(--spacing-16);
		margin-top: calc(-1 * var(--spacing-2));
		padding: 0 var(--spacing-2) 0 0;
		border-left: 0;
		text-align: right;
	}

	.tint {
		position: absolute;
		bottom: 0;
		border-inline: var(--border-width-hairline) dashed var(--color-highlight);
		background: var(--color-tag);
	}

	.vertical .tint {
		right: 0;
		bottom: auto;
		border-block: var(--border-width-hairline) dashed var(--color-highlight);
		border-inline: 0;
	}

	.outside {
		position: absolute;
		bottom: 0;
		z-index: 3;
		background: var(--color-tag);
	}

	.vertical .outside {
		right: 0;
		bottom: auto;
	}

	.outside.start {
		border-right: var(--border-width-hairline) solid var(--color-fg-muted);
	}

	.outside.end {
		border-left: var(--border-width-hairline) solid var(--color-fg-muted);
	}

	.vertical .outside.start {
		border-right: 0;
		border-bottom: var(--border-width-hairline) solid var(--color-fg-muted);
	}

	.vertical .outside.end {
		border-top: var(--border-width-hairline) solid var(--color-fg-muted);
		border-left: 0;
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

	.vertical .reading {
		top: 50%;
		right: 0;
		bottom: auto;
		left: var(--spacing-16);
		width: auto;
		height: 0;
		border-top: var(--border-width-hairline) solid var(--color-highlight);
		border-left: 0;
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

	.vertical .reading-year {
		right: var(--spacing-2);
		bottom: auto;
		transform: translateY(-50%);
	}
</style>
