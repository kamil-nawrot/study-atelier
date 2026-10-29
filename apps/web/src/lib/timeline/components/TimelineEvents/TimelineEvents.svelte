<script lang="ts">
	import { Tooltip } from '@study-atelier/ui';
	import { formatDate } from '#lib/catalogue/years/years.ts';
	import { m } from '#lib/i18n/i18n.ts';
	import { layEvents } from '#lib/timeline/event-lanes/event-lanes.ts';
	import type { LaidEvent } from '#lib/timeline/types/laid-event.ts';
	import { cutLabel } from '#lib/timeline/labels/labels.ts';
	import { NAME_MAX_WIDTH } from '#lib/timeline/label-width/label-width.ts';
	import { boxStyle } from '#lib/timeline/stage/stage.ts';
	import type { StageGeometry } from '#lib/timeline/types/stage-geometry.ts';
	import type { Era } from '#lib/timeline/types/era.ts';
	import type { TimelineEvent } from '#lib/timeline/types/timeline-event.ts';

	type Props = {
		events: readonly TimelineEvent[];
		era: Era;
		geometry: StageGeometry;
		lanes: number;
		selected: string | null;
		labelWidth: (event: TimelineEvent) => number;
		nameCut?: (event: TimelineEvent) => boolean;
		onselect: (event: TimelineEvent) => void;
		layoutSpan?: number;
	};

	let {
		events,
		era,
		geometry,
		lanes,
		selected,
		labelWidth,
		nameCut = () => false,
		onselect,
		layoutSpan
	}: Props = $props();

	const VISIBLE_MARGIN = 400;
	const MIN_RIBBON = 2;

	let vertical = $derived(geometry.orientation === 'vertical');
	let perYear = $derived(geometry.length / (layoutSpan ?? geometry.view.span));
	let laid = $derived(layEvents(events, era, perYear, labelWidth));
	let near = $derived(
		laid
			.map((item) => ({
				item,
				from: geometry.position(item.start),
				to: geometry.position(item.end)
			}))
			.filter(
				(shown) => shown.to > -VISIBLE_MARGIN && shown.from < geometry.length + VISIBLE_MARGIN
			)
	);
	let visible = $derived(near.filter((shown) => shown.item.lane < lanes));
	let hidden = $derived(
		near.filter((shown) => shown.item.lane >= lanes && shown.to > 0 && shown.from < geometry.length)
			.length
	);

	function label(item: LaidEvent): string {
		return cutLabel(item.event.name, item.cutBefore, item.cutAfter);
	}

	function title(item: LaidEvent): string {
		const date = formatDate(item.event.yearFrom, item.event.yearTo, item.event.yearApproximate);
		return [label(item), date].filter(Boolean).join(', ');
	}

	function across(item: LaidEvent): number {
		return geometry.eventsFrom + item.lane * geometry.lane;
	}

	function placement(shown: (typeof visible)[number]): 'top' | 'bottom' {
		if (vertical) return shown.from > geometry.length / 2 ? 'top' : 'bottom';
		return shown.item.lane === 0 ? 'bottom' : 'top';
	}

	function align(shown: (typeof visible)[number]): 'start' | 'end' {
		return !vertical && shown.from > geometry.length / 2 ? 'end' : 'start';
	}
</script>

{#snippet name(shown: (typeof visible)[number])}
	{#if nameCut(shown.item.event)}
		<Tooltip align={align(shown)} placement={placement(shown)} text={shown.item.event.name}>
			<span style:max-inline-size="{NAME_MAX_WIDTH}px" class="name" aria-hidden="true"
				>{label(shown.item)}</span
			>
		</Tooltip>
	{:else}
		<span class="name" aria-hidden="true">{label(shown.item)}</span>
	{/if}
{/snippet}

{#if events.length === 0 && !vertical}
	<p
		style={boxStyle(geometry, { along: geometry.length / 2, across: geometry.eventsFrom })}
		class="empty caption"
	>
		{m.timeline.noEvents}
	</p>
{/if}

{#each visible as shown (shown.item.event.id)}
	{#if shown.item.shape === 'pin'}
		<button
			style={boxStyle(geometry, { along: (shown.from + shown.to) / 2, across: across(shown.item) })}
			class="pin"
			class:selected={shown.item.event.id === selected}
			class:vertical
			aria-label={title(shown.item)}
			aria-pressed={shown.item.event.id === selected}
			onclick={() => onselect(shown.item.event)}
			type="button"
		>
			<span class="diamond" aria-hidden="true"></span>
			{@render name(shown)}
		</button>
	{:else}
		{@const from = Math.max(shown.from, -4)}
		{@const to = Math.min(shown.to, geometry.length + 4)}
		<button
			style={boxStyle(geometry, {
				along: from,
				across: across(shown.item),
				alongSize: Math.max(to - from, MIN_RIBBON)
			})}
			class="ribbon"
			class:outside={!shown.item.inside}
			class:selected={shown.item.event.id === selected}
			class:vertical
			aria-label={title(shown.item)}
			aria-pressed={shown.item.event.id === selected}
			onclick={() => onselect(shown.item.event)}
			type="button"
		>
			{@render name(shown)}
		</button>
	{/if}
{/each}

{#if hidden > 0}
	<span
		style={boxStyle(geometry, {
			along: geometry.length - geometry.lane * (vertical ? 1 : 2),
			across: geometry.eventsFrom + (vertical ? 0 : (lanes - 1) * geometry.lane)
		})}
		class="hidden caption"
		title={m.timeline.hiddenEvents(hidden)}
	>
		+{hidden}
		<span class="visually-hidden">{m.timeline.hiddenEvents(hidden)}</span>
	</span>
{/if}

<style>
	.empty {
		position: absolute;
		z-index: 1;
		padding-inline: var(--spacing-2);
		transform: translateX(-50%);
	}

	.ribbon,
	.pin {
		position: absolute;
		z-index: 2;
		display: flex;
		align-items: center;
		height: var(--spacing-6);
		padding: 0;
		border: 0;
		background: none;
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		white-space: nowrap;
		cursor: pointer;
	}

	.ribbon.vertical,
	.pin.vertical {
		flex-direction: column;
		width: var(--spacing-4);
		height: auto;
	}

	.ribbon {
		overflow: visible;
		border-left: var(--border-width-base) solid var(--color-fg-muted);
		background: var(--color-tag);
	}

	.ribbon.vertical {
		align-items: center;
		border-top: var(--border-width-base) solid var(--color-fg-muted);
		border-left: 0;
	}

	.name {
		box-sizing: content-box;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.ribbon .name {
		padding-inline: var(--spacing-2);
	}

	.vertical .name {
		writing-mode: vertical-rl;
		padding: var(--spacing-2) 0;
	}

	.ribbon.outside > .name,
	.ribbon.outside > :global(.tooltip) {
		position: absolute;
		left: 100%;
	}

	.ribbon.vertical.outside > .name,
	.ribbon.vertical.outside > :global(.tooltip) {
		top: 100%;
		left: auto;
	}

	.ribbon.selected {
		border-color: var(--color-highlight);
		background: var(--color-highlight);
		color: var(--color-on-fg);
	}

	.ribbon.selected.outside .name {
		color: var(--color-fg);
	}

	.pin {
		gap: var(--spacing-2);
		margin-left: calc(-1 * var(--spacing-1));
	}

	.pin.vertical {
		margin-top: calc(-1 * var(--spacing-1));
		margin-left: 0;
	}

	.diamond {
		flex: none;
		width: var(--spacing-2);
		height: var(--spacing-2);
		background: var(--color-fg-muted);
		transform: rotate(45deg);
	}

	.pin.selected .diamond {
		background: var(--color-highlight);
	}

	.ribbon:hover,
	.pin:hover {
		z-index: 3;
	}

	.ribbon:focus-visible,
	.pin:focus-visible {
		outline: var(--border-width-base) solid var(--color-highlight);
	}

	.hidden {
		position: absolute;
		z-index: 2;
		padding-inline: var(--spacing-1);
		background: var(--color-surface);
		transform: translateY(-50%);
	}
</style>
