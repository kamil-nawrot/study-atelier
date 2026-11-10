<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import {
		axisKind,
		labelGroups,
		labelStride,
		segments,
		tickYears
	} from '#lib/timeline/axis/axis.ts';
	import { segmentLabel } from '#lib/timeline/labels/labels.ts';
	import { boxStyle } from '#lib/timeline/stage/stage.ts';
	import { timeOf } from '#lib/timeline/time/time.ts';
	import type { Era } from '#lib/timeline/types/era.ts';
	import type { StageGeometry } from '#lib/timeline/types/stage-geometry.ts';

	type Props = {
		geometry: StageGeometry;
		era: Era;
	};

	let { geometry, era }: Props = $props();

	const LABEL_MIN = 48;
	const LABEL_MIN_VERTICAL = 24;
	const LABEL_CHAR = 9;
	const LABEL_PADDING = 16;
	const LABEL_HEIGHT_VERTICAL = 64;

	let view = $derived(geometry.view);
	let length = $derived(geometry.length);
	let vertical = $derived(geometry.orientation === 'vertical');
	let kind = $derived(axisKind(view));
	let unit = $derived<100 | 1000>(kind === 'millennia' ? 1000 : 100);
	let longest = $derived(
		Math.max(
			...segments({ center: (era.start + era.end) / 2, span: era.end - era.start }, unit).map(
				(segment) => segmentLabel(segment, unit).length
			)
		)
	);
	let stride = $derived(
		labelStride(
			(length * unit) / view.span,
			vertical ? LABEL_HEIGHT_VERTICAL : LABEL_PADDING + LABEL_CHAR * longest
		)
	);
	let labels = $derived(
		kind === 'years'
			? []
			: labelGroups(view, era, unit, stride)
					.map((group) => {
						const from = Math.max(geometry.position(Math.max(group.start, era.start)), 0);
						const to = Math.min(geometry.position(Math.min(group.end, era.end)), length);
						return { key: `${unit}:${group.start}`, text: segmentLabel(group, unit), from, to };
					})
					.filter((label) => label.to - label.from > (vertical ? LABEL_MIN_VERTICAL : LABEL_MIN))
	);
	let ticks = $derived(
		tickYears(view)
			.map((year) => ({ year, at: geometry.position(timeOf(year)) }))
			.filter((tick) => tick.at >= 0 && tick.at <= length)
	);
</script>

<div class="axis" class:vertical aria-hidden="true">
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

<style>
	.axis {
		position: absolute;
		top: 0;
		right: 0;
		left: 0;
		height: var(--spacing-12);
		border-bottom: var(--border-width-hairline) solid var(--color-tag);
	}

	.axis.vertical {
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
</style>
