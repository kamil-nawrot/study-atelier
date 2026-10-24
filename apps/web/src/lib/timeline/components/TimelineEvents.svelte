<script lang="ts">
	import { formatDate } from '#lib/catalogue/years/years.ts';
	import { m } from '#lib/i18n/index.ts';
	import { layEvents, type LaidEvent } from '../event-lanes.ts';
	import { cutLabel } from '../labels.ts';
	import { boxStyle, type StageGeometry } from '../stage.ts';
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
		layoutSpan?: number;
	};

	let { events, era, geometry, lanes, selected, labelWidth, onselect, layoutSpan }: Props =
		$props();

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
</script>

{#if events.length === 0}
	<p
		style={boxStyle(geometry, { along: geometry.length / 2, across: geometry.eventsFrom })}
		class="empty caption"
		class:vertical
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
			<span class="name" aria-hidden="true">{label(shown.item)}</span>
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
			<span class="name" aria-hidden="true">{label(shown.item)}</span>
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

	.empty.vertical {
		writing-mode: vertical-rl;
		padding: var(--spacing-2) 0;
		transform: translateY(-50%);
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

	.ribbon .name {
		padding-inline: var(--spacing-2);
	}

	.vertical .name {
		writing-mode: vertical-rl;
		padding: var(--spacing-2) 0;
	}

	.ribbon.outside .name {
		position: absolute;
		left: 100%;
	}

	.ribbon.vertical.outside .name {
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
