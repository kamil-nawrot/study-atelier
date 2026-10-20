<script lang="ts">
	import { formatDate } from '#lib/collection/format.ts';
	import { m } from '#lib/i18n/index.ts';
	import { layEvents, type LaidEvent } from '../event-lanes.ts';
	import { EVENT_LANE_HEIGHT, type StageGeometry } from '../stage.ts';
	import type { Era } from '../time.ts';
	import type { TimelineEvent } from '../types.ts';

	type Props = {
		events: readonly TimelineEvent[];
		era: Era;
		geometry: StageGeometry;
		lanes: number;
		selected: string | null;
		labelWidth: (event: TimelineEvent) => number;
		onselect: (event: TimelineEvent) => void;
	};

	let { events, era, geometry, lanes, selected, labelWidth, onselect }: Props = $props();

	const VISIBLE_MARGIN = 400;
	const MIN_RIBBON = 2;

	let laid = $derived(layEvents(events, era, geometry.width / geometry.view.span, labelWidth));
	let near = $derived(
		laid
			.map((item) => ({
				item,
				from: geometry.position(item.start),
				to: geometry.position(item.end)
			}))
			.filter((shown) => shown.to > -VISIBLE_MARGIN && shown.from < geometry.width + VISIBLE_MARGIN)
	);
	let visible = $derived(near.filter((shown) => shown.item.lane < lanes));
	let hidden = $derived(
		near.filter((shown) => shown.item.lane >= lanes && shown.to > 0 && shown.from < geometry.width)
			.length
	);

	function label(item: LaidEvent): string {
		return `${item.cutBefore ? '‹ ' : ''}${item.event.name}${item.cutAfter ? ' ›' : ''}`;
	}

	function title(item: LaidEvent): string {
		const date = formatDate(item.event.yearFrom, item.event.yearTo, item.event.yearApproximate);
		return [label(item), date].filter(Boolean).join(', ');
	}

	function top(item: LaidEvent): number {
		return geometry.eventsTop + item.lane * EVENT_LANE_HEIGHT;
	}
</script>

{#if events.length === 0}
	<p style:top={`${geometry.eventsTop}px`} class="empty caption">{m.timeline.noEvents}</p>
{/if}

{#each visible as shown (shown.item.event.id)}
	{#if shown.item.shape === 'pin'}
		<button
			style:left={`${(shown.from + shown.to) / 2}px`}
			style:top={`${top(shown.item)}px`}
			class="pin"
			class:selected={shown.item.event.id === selected}
			aria-label={title(shown.item)}
			aria-pressed={shown.item.event.id === selected}
			onclick={() => onselect(shown.item.event)}
			type="button"
		>
			<span class="diamond" aria-hidden="true"></span>
			<span class="name" aria-hidden="true">{label(shown.item)}</span>
		</button>
	{:else}
		{@const from = Math.max(shown.from, -4)}
		{@const to = Math.min(shown.to, geometry.width + 4)}
		<button
			style:left={`${from}px`}
			style:top={`${top(shown.item)}px`}
			style:width={`${Math.max(to - from, MIN_RIBBON)}px`}
			class="ribbon"
			class:outside={!shown.item.inside}
			class:selected={shown.item.event.id === selected}
			aria-label={title(shown.item)}
			aria-pressed={shown.item.event.id === selected}
			onclick={() => onselect(shown.item.event)}
			type="button"
		>
			<span class="name" aria-hidden="true">{label(shown.item)}</span>
		</button>
	{/if}
{/each}

{#if hidden > 0}
	<span
		style:top={`${geometry.eventsTop + lanes * EVENT_LANE_HEIGHT - EVENT_LANE_HEIGHT / 2}px`}
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
		left: 50%;
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

	.ribbon {
		overflow: visible;
		border-left: var(--border-width-base) solid var(--color-fg-muted);
		background: var(--color-tag);
	}

	.ribbon .name {
		padding-inline: var(--spacing-2);
	}

	.ribbon.outside .name {
		position: absolute;
		left: 100%;
	}

	.ribbon.selected {
		border-left-color: var(--color-highlight);
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

	.ribbon:focus-visible,
	.pin:focus-visible {
		outline: var(--border-width-base) solid var(--color-highlight);
	}

	.hidden {
		position: absolute;
		right: var(--spacing-2);
		z-index: 2;
		padding-inline: var(--spacing-1);
		background: var(--color-surface);
		transform: translateY(-50%);
	}
</style>
