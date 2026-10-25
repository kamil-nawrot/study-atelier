<script lang="ts">
	import type { Snippet } from 'svelte';
	import { m } from '#lib/i18n/i18n.ts';
	import { lineTimes } from '#lib/timeline/axis/axis.ts';
	import ReadingLine from '#lib/timeline/components/ReadingLine/ReadingLine.svelte';
	import TimelineAxis from '#lib/timeline/components/TimelineAxis/TimelineAxis.svelte';
	import { stageGestures } from '#lib/timeline/stage-gestures/stage-gestures.ts';
	import { boxStyle, stageGeometry, stageSize } from '#lib/timeline/stage/stage.ts';
	import type { Orientation } from '#lib/timeline/types/orientation.ts';
	import type { StageGeometry } from '#lib/timeline/types/stage-geometry.ts';
	import type { Era } from '#lib/timeline/types/era.ts';
	import type { TimeSpan } from '#lib/timeline/types/time-span.ts';
	import type { View } from '#lib/timeline/types/view.ts';

	type Props = {
		era: Era;
		view: View;
		orientation?: Orientation;
		eventLanes?: number;
		artworkLanes?: number;
		tint?: TimeSpan;
		onpan: (by: number) => void;
		onkeypan: (share: number) => void;
		onbackground?: () => void;
		onstep: (direction: 1 | -1, anchor?: number) => void;
		onsettle?: () => void;
		viewportHeight?: number;
		events?: Snippet<[StageGeometry]>;
		artworks?: Snippet<[StageGeometry]>;
	};

	let {
		era,
		view,
		orientation = 'horizontal',
		eventLanes = 1,
		artworkLanes = 0,
		tint,
		onpan,
		onkeypan,
		onbackground,
		onstep,
		onsettle,
		viewportHeight = 0,
		events,
		artworks
	}: Props = $props();

	let width = $state(0);

	let vertical = $derived(orientation === 'vertical');
	let geometry = $derived(
		stageGeometry(view, width, eventLanes, orientation, viewportHeight, artworkLanes)
	);
	let size = $derived(stageSize(geometry));
	let length = $derived(geometry.length);
	let before = $derived(Math.max(0, geometry.position(era.start)));
	let after = $derived(Math.max(0, length - geometry.position(era.end)));
	let lines = $derived(
		lineTimes(view, length, era).map((time) => ({ time, at: geometry.position(time) }))
	);
</script>

<div
	style:height={`${size.height}px`}
	style:--events-from={`${geometry.eventsFrom}px`}
	style:--events-size={`${geometry.eventsSize}px`}
	style:--artworks-from={`${geometry.artworksFrom}px`}
	class="stage"
	class:vertical
	{@attach stageGestures(() => ({
		vertical,
		view,
		length,
		onpan,
		onstep,
		onsettle,
		onbackground
	}))}
	aria-label={m.timeline.stageGroup}
	role="group"
	bind:clientWidth={width}
>
	{#if eventLanes > 0}
		<div class="zone" aria-hidden="true"></div>
	{/if}
	{#if !vertical}
		{#if eventLanes > 0}
			<span style:left={`${before}px`} class="zone-label events-label" aria-hidden="true">
				{m.timeline.zones.events}
			</span>
		{/if}
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

	<TimelineAxis {era} {geometry} />

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

	<ReadingLine {era} {onkeypan} {onstep} {orientation} {view} />
</div>

<style>
	.stage {
		position: relative;
		overflow: hidden;
		isolation: isolate;
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
</style>
